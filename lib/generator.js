const fs = require('fs-extra');
const path = require('path');
const parser = require('./parser');
const renderer = require('./renderer');
const { glob } = require('glob');

/**
 * Generate ERD diagram from Laravel models
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Results of generation
 */
async function generate(options) {
  // Find all model files
  const modelFiles = await glob(`${options.modelsDir}/**/*.php`);
  
  if (modelFiles.length === 0) {
    throw new Error('No model files found');
  }
  
  console.log(`Found ${modelFiles.length} model files.`);
  
  // Parse models to extract entities and relationships
  const entities = [];
  const relationships = [];
  const allForeignKeys = [];
  const errors = [];
  
  // First pass: collect all relationships to identify foreign keys
  for (const file of modelFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const modelName = path.basename(file, '.php');
      
      // Skip files that don't look like models
      if (!isLikelyModelFile(content, modelName)) {
        continue;
      }
      
      if (options.includeRelations) {
        const relationshipInfo = parser.parseRelationships(modelName, content, entities);
        relationships.push(...relationshipInfo.relationships);
        allForeignKeys.push(...relationshipInfo.foreignKeys);
      }
    } catch (err) {
      console.error(`Error processing relationships in ${file}: ${err.message}`);
      errors.push({ file, error: err.message });
    }
  }
  
  // Second pass: parse entities with foreign key information
  for (const file of modelFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const modelName = path.basename(file, '.php');
      
      // Skip files that don't look like models
      if (!isLikelyModelFile(content, modelName)) {
        continue;
      }
      
      console.log(`Parsing model: ${modelName}`);
      const entity = parser.parseModel(modelName, content, allForeignKeys);
      
      if (entity) {
        entities.push(entity);
      }
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
      errors.push({ file, error: err.message });
    }
  }
  
  if (entities.length === 0) {
    throw new Error('No valid models found to generate ERD');
  }
  
  console.log(`Extracted ${entities.length} entities and ${relationships.length} relationships.`);
  
  // Generate the ERD diagram
  const diagram = renderer.renderERD(entities, relationships, options.title);
  
  // Create the HTML viewer
  const htmlContent = renderer.createViewer(diagram, options.title);
  
  // Make sure the output directory exists
  await fs.ensureDir(options.outputDir);
  
  // Write output files
  await fs.writeFile(path.join(options.outputDir, 'index.html'), htmlContent);
  await fs.writeFile(path.join(options.outputDir, 'diagram.mmd'), diagram);
  
  // Copy additional assets if needed
  // await copyAssets(options.outputDir);
  
  return { 
    entities: {
      count: entities.length,
      names: entities.map(e => e.name)
    }, 
    relationships: {
      count: relationships.length
    },
    errors
  };
}

/**
 * Determine if a file likely contains a Laravel model
 * @param {string} content File content
 * @param {string} filename Filename
 * @returns {boolean} Whether file looks like a model
 */
function isLikelyModelFile(content, filename) {
  // Check if file extends Model or Eloquent
  if (content.includes('extends Model') || 
      content.includes('extends Eloquent') ||
      content.includes('extends \\Illuminate\\Database\\Eloquent\\Model')) {
    return true;
  }
  
  // Check for common model traits
  if (content.includes('use HasFactory') || 
      content.includes('use SoftDeletes') ||
      content.includes('protected $table') ||
      content.includes('protected $fillable')) {
    return true;
  }
  
  // Check filename for common patterns like ending with "Model"
  if (filename.endsWith('Model')) {
    return true;
  }
  
  return false;
}

/**
 * Generate ERD from a manually defined schema object
 * Useful for applications without model files or for testing
 * @param {Object} schema Schema definition object
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Results of generation
 */
async function generateFromSchema(schema, options) {
  const entities = schema.entities || [];
  const relationships = schema.relationships || [];
  
  if (entities.length === 0) {
    throw new Error('No entities defined in schema');
  }
  
  // Generate the ERD diagram
  const diagram = renderer.renderERD(entities, relationships, options.title);
  
  // Create the HTML viewer
  const htmlContent = renderer.createViewer(diagram, options.title);
  
  // Make sure the output directory exists
  await fs.ensureDir(options.outputDir);
  
  // Write output files
  await fs.writeFile(path.join(options.outputDir, 'index.html'), htmlContent);
  await fs.writeFile(path.join(options.outputDir, 'diagram.mmd'), diagram);
  
  return { 
    entities: {
      count: entities.length,
      names: entities.map(e => e.name)
    }, 
    relationships: {
      count: relationships.length
    }
  };
}

/**
 * Copy necessary assets to the output directory
 * @param {string} outputDir Output directory path
 * @returns {Promise<void>}
 */
async function copyAssets(outputDir) {
  const assetsDir = path.join(__dirname, 'assets');
  
  // Check if assets directory exists
  try {
    await fs.access(assetsDir);
    await fs.copy(assetsDir, path.join(outputDir, 'assets'));
  } catch (err) {
    // Assets directory doesn't exist, no need to copy
    console.log('No assets directory found, skipping asset copy.');
  }
}

/**
 * Clean output directory before generating new files
 * @param {string} outputDir Output directory path
 * @param {boolean} keepDir Whether to keep the directory itself
 * @returns {Promise<void>}
 */
async function cleanOutputDir(outputDir, keepDir = true) {
  try {
    if (keepDir) {
      // Clean directory contents but keep the directory
      const files = await fs.readdir(outputDir);
      
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        await fs.remove(filePath);
      }
    } else {
      // Remove entire directory
      await fs.remove(outputDir);
    }
  } catch (err) {
    // Directory doesn't exist, no need to clean
    console.log('Output directory does not exist, skipping clean.');
  }
}

/**
 * Generate a default configuration object with sensible defaults
 * @param {Object} overrides Configuration overrides
 * @returns {Object} Configuration object
 */
function defaultConfig(overrides = {}) {
  return {
    modelsDir: './app/Models',
    outputDir: './erd-output',
    title: 'Laravel ERD Diagram',
    includeRelations: true,
    includeVirtualAttributes: false,
    cleanOutput: false,
    ...overrides
  };
}

/**
 * Generate ERD diagram for Laravel models with auto-detected configuration
 * @returns {Promise<Object>} Results of generation
 */
async function autoGenerate() {
  const config = defaultConfig();
  
  // Try to detect Laravel project structure
  try {
    const rootDir = process.cwd();
    
    // Check if we're in a Laravel project
    const composerPath = path.join(rootDir, 'composer.json');
    if (await fs.pathExists(composerPath)) {
      const composer = await fs.readJson(composerPath);
      if (composer.require && (composer.require['laravel/framework'] || composer.require['laravel/laravel'])) {
        console.log('Laravel project detected!');
        
        // Check app directory structure
        if (await fs.pathExists(path.join(rootDir, 'app', 'Models'))) {
          config.modelsDir = path.join(rootDir, 'app', 'Models');
        } else if (await fs.pathExists(path.join(rootDir, 'app'))) {
          config.modelsDir = path.join(rootDir, 'app');
        }
      }
    }
    
    return await generate(config);
    
  } catch (err) {
    console.error('Auto-detection failed:', err.message);
    return await generate(config);
  }
}

module.exports = {
  generate,
  generateFromSchema,
  cleanOutputDir,
  copyAssets,
  defaultConfig,
  autoGenerate
};