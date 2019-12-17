import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkTextureLODsDownloader from 'vtk.js/Sources/Rendering/Misc/TextureLODsDownloader';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

const { vtkErrorMacro } = macro;

let itemCount = 1;

function applySettings(sceneItem, settings) {
  if (settings.actor) {
    sceneItem.actor.set(settings.actor);
  }

  if (settings.actorRotation) {
    sceneItem.actor.rotateWXYZ(
      settings.actorRotation[0],
      settings.actorRotation[1],
      settings.actorRotation[2],
      settings.actorRotation[3]
    );
  }

  if (settings.property) {
    sceneItem.actor.getProperty().set(settings.property);
  }

  if (settings.mapper) {
    if (settings.mapper.colorByArrayName) {
      sceneItem.source.enableArray(
        settings.mapper.colorByArrayName,
        settings.mapper.colorByArrayName
      );
      sceneItem.source.loadData();
    }

    sceneItem.mapper.set(settings.mapper);
  }

  if (settings.lookupTable) {
    sceneItem.mapper.getLookupTable().set(settings.lookupTable);
    sceneItem.mapper.getLookupTable().build();
  }

  if (settings.textureLODs) {
    sceneItem.textureLODs = settings.textureLODs;
  }
}

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function loadHttpDataSetReader(item, model, publicAPI) {
  const source = vtkHttpDataSetReader.newInstance({
    fetchGzip: model.fetchGzip,
    dataAccessHelper: model.dataAccessHelper,
  });
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  const sceneItem = {
    name: item.name || `Item ${itemCount++}`,
    source,
    mapper,
    actor,
    defaultSettings: item,
  };
  if (item.texture && item.texture in model.usedTextures) {
    // If this texture has already been used, re-use it
    actor.addTexture(model.usedTextures[item.texture]);
  } else if (item.texture) {
    const textureSource = vtkHttpDataSetReader.newInstance({
      fetchGzip: model.fetchGzip,
      dataAccessHelper: model.dataAccessHelper,
    });
    textureSource
      .setUrl([model.baseURL, item.texture].join('/'), { loadData: true })
      .then(() => {
        const texture = vtkTexture.newInstance();
        texture.setInterpolate(true);
        texture.setRepeat(true);
        texture.setInputData(textureSource.getOutputData());
        actor.addTexture(texture);
        sceneItem.texture = texture;
        model.usedTextures[item.texture] = texture;
      });
  }

  const { textureLODs } = item;
  if (textureLODs && textureLODs.files && textureLODs.files.length !== 0) {
    // If this texture LOD has already been used, re-use it
    const textureLODsStr = JSON.stringify(textureLODs);
    if (textureLODsStr in model.usedTextureLODs) {
      actor.addTexture(model.usedTextureLODs[textureLODsStr]);
    } else {
      // Set it on the scene item so it can be accessed later, for
      // doing things like setting a callback function.
      sceneItem.textureLODsDownloader = vtkTextureLODsDownloader.newInstance();
      const textureDownloader = sceneItem.textureLODsDownloader;

      const texture = vtkTexture.newInstance();
      texture.setInterpolate(true);
      actor.addTexture(texture);
      model.usedTextureLODs[textureLODsStr] = texture;

      textureDownloader.setTexture(texture);
      textureDownloader.setCrossOrigin('anonymous');
      textureDownloader.setBaseUrl(textureLODs.baseUrl);
      textureDownloader.setFiles(textureLODs.files);
      textureDownloader.startDownloads();
    }
  }

  if (model.renderer) {
    model.renderer.addActor(actor);
  }

  actor.setMapper(mapper);
  mapper.setInputConnection(source.getOutputPort());

  source
    .setUrl([model.baseURL, item.httpDataSetReader.url].join('/'), {
      loadData: true,
    })
    .then(() => {
      publicAPI.invokeReady();
    });

  applySettings(sceneItem, item);
  model.scene.push(sceneItem);

  return sceneItem;
}

const TYPE_MAPPING = {
  httpDataSetReader: loadHttpDataSetReader,
};

function updateDatasetTypeMapping(typeName, handler) {
  TYPE_MAPPING[typeName] = handler;
}

// ----------------------------------------------------------------------------
// vtkHttpSceneLoader methods
// ----------------------------------------------------------------------------

function vtkHttpSceneLoader(publicAPI, model) {
  const originalSceneParameters = {};

  // These are here to re-use the same textures when possible
  model.usedTextures = {};
  model.usedTextureLODs = {};

  // Set our className
  model.classHierarchy.push('vtkHttpSceneLoader');

  // Create scene container
  if (!model.scene) {
    model.scene = [];
  }

  function setCameraParameters(params) {
    if (model.renderer) {
      const camera = model.renderer.getActiveCamera();
      if (camera) {
        camera.set(params);
      } else {
        vtkErrorMacro('No active camera to update');
      }
    }
  }

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  publicAPI.update = () => {
    model.dataAccessHelper.fetchJSON(publicAPI, model.url).then(
      (data) => {
        if (data.fetchGzip !== undefined) {
          model.fetchGzip = data.fetchGzip;
        }
        if (data.background && model.renderer) {
          model.renderer.setBackground(...data.background);
        }
        if (data.camera) {
          originalSceneParameters.camera = data.camera;
          setCameraParameters(data.camera);
        }
        if (data.scene) {
          data.scene.forEach((item) => {
            const builder = TYPE_MAPPING[item.type];
            if (builder) {
              builder(item, model, publicAPI);
            }
          });
          global.scene = model.scene;

          // Clear these
          model.usedTextures = {};
          model.usedTextureLODs = {};
        }
        // Capture index.json into meta
        model.metadata = data;
      },
      (error) => {
        vtkErrorMacro(`Error fetching scene ${error}`);
      }
    );
  };

  publicAPI.resetScene = () => {
    if (originalSceneParameters.camera) {
      setCameraParameters(originalSceneParameters.camera);
    }
  };

  // Set DataSet url
  publicAPI.setUrl = (url) => {
    if (url.indexOf('index.json') === -1) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    // Fetch data
    return publicAPI.update();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fetchGzip: false,
  url: null,
  baseURL: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'fetchGzip',
    'url',
    'baseURL',
    'scene',
    'metadata',
  ]);
  macro.setGet(publicAPI, model, ['renderer']);
  macro.event(publicAPI, model, 'ready');

  // Object methods
  vtkHttpSceneLoader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHttpSceneLoader');

// ----------------------------------------------------------------------------

export default { newInstance, extend, applySettings, updateDatasetTypeMapping };
