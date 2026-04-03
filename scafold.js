const fs = require('fs');
const path = require('path');

const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node scaffold.js <spec.json>');
  process.exit(1);
}

// 1. Setup Project Folders (Current Directory)
const projectRoot = process.cwd();
const handlersDir = path.join(projectRoot, 'handlers');
const configDir = path.join(projectRoot, 'config');

[handlersDir, configDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. Load and Copy Spec
const specData = fs.readFileSync(path.resolve(specPath), 'utf8');
const spec = JSON.parse(specData);
fs.writeFileSync(path.join(configDir, 'openapi.json'), specData);

console.log(`[Config] Copied spec to ./config/openapi.json`);

/**
 * Transforms a path into an operationId-compatible string
 */
const pathToId = (routePath) => routePath.replace(/^\/|\/$/g, '').replace(/\//g, '_');

// 3. Generate Handlers
Object.entries(spec.paths).forEach(([routePath, operations]) => {
  const segments = routePath.split('/').filter(Boolean);
  const fileName = segments.pop() + '.js';
  const folderPath = path.join(handlersDir, ...segments);

  fs.mkdirSync(folderPath, { recursive: true });

  const methods = Object.keys(operations).filter(k => 
    ['get', 'post', 'put', 'delete', 'patch'].includes(k.toLowerCase())
  );

  let content = `/** Handler for ${routePath} **/\n\n`;
  methods.forEach(method => {
    content += `// Expects operationId: ${pathToId(routePath)}_${method}\n`;
    content += `exports.${method.toLowerCase()} = async (c, req, res) => {\n`;
    content += `  return res.status(200).json({\n`;
    content += `    operation: c.operation.operationId,\n`;
    content += `    path: "${routePath}"\n`;
    content += `  });\n`;
    content += `};\n\n`;
  });

  fs.writeFileSync(path.join(folderPath, fileName), content);
  console.log(`[Generated] ./handlers/${segments.join('/')}/${fileName}`);
});

// 4. Generate app.js with Ajv-Formats validation
const appJsContent = `
const express = require('express');
const OpenAPIBackend = require('openapi-backend').default;
const path = require('path');
const fs = require('fs');
const addFormats = require('ajv-formats'); // Required for email, uri, date validation

const definition = require('./config/openapi.json');

const app = express();
app.use(express.json());

const handlers = {};
const handlersDir = path.join(__dirname, 'handlers');

const registerRecursive = (dir, prefix = '') => {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      registerRecursive(fullPath, \`\${prefix}\${item}_\`);
    } else if (item.endsWith('.js')) {
      const fileName = item.replace('.js', '');
      const module = require(fullPath);
      Object.keys(module).forEach(verb => {
        const operationId = \`\${prefix}\${fileName}_\${verb}\`;
        handlers[operationId] = module[verb];
      });
    }
  }
};

registerRecursive(handlersDir);

const api = new OpenAPIBackend({
  definition,
  // Enable detailed validation options
  ajvOpts: {
    allErrors: true,
    verbose: true,
  },
  // Register the formats plugin (validates email, uri, date, etc.)
  customizeAjv: (ajv) => {
    addFormats(ajv);
    return ajv;
  },
  handlers: {
    ...handlers,
    validationFail: (c, req, res) => res.status(400).json({ errors: c.validation.errors }),
    notFound: (c, req, res) => res.status(404).json({ error: 'Not Found' }),
  },
});

api.init();

app.use((req, res) => api.handleRequest(req, req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`🚀 Server ready at http://localhost:\${PORT}\`));
`;

fs.writeFileSync(path.join(projectRoot, 'app.js'), appJsContent);
console.log(`[Generated] ./app.js`);