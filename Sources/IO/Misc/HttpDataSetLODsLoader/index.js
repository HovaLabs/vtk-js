import macro from 'vtk.js/Sources/macro';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkHttpDataSetLODsLoader methods
// ----------------------------------------------------------------------------

function vtkHttpDataSetLODsLoader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHttpDataSetLODsLoader');

  const internal = {
    downloadStack: [],
  };

  //--------------------------------------------------------------------------

  publicAPI.startDownloads = () => {
    if (!model.mapper) {
      vtkErrorMacro('Mapper was not set.');
      return;
    }

    if (!model.files || model.files.length === 0) {
      vtkErrorMacro('No files set.');
      return;
    }

    let baseUrl = model.baseUrl;
    if (baseUrl && !baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    // Create the download stack
    internal.downloadStack = [];
    model.files.forEach((file) =>
      internal.downloadStack.push(`${baseUrl}${file}`)
    );

    const downloadNextSource = () => {
      const url = internal.downloadStack.shift();
      const nextSource = vtkHttpDataSetReader.newInstance({
        dataAccessHelper: DataAccessHelper.get('http'),
      });

      model.currentSource = nextSource;

      const options = {
        compression: 'zip',
        loadData: true,
        fullpath: true,
      };
      nextSource.setUrl(url, options).then(() => {
        model.mapper.setInputConnection(nextSource.getOutputPort());

        if (model.sceneItem) {
          // Apply settings to the new source
          const settings = model.sceneItem.defaultSettings;
          if (settings.mapper) {
            if (settings.mapper.colorByArrayName) {
              nextSource.enableArray(
                settings.mapper.colorByArrayName,
                settings.mapper.colorByArrayName
              );
            }
          }
          model.sceneItem.source = nextSource;
        }

        if (model.stepFinishedCallback) {
          // In clients like paraview glance, the callback might
          // involve setting the current source on a proxy
          model.stepFinishedCallback();
        }
        if (internal.downloadStack.length !== 0) {
          downloadNextSource();
        }
      });
    };

    downloadNextSource();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  baseUrl: '',
  // The currentSource is set internally to the most recently
  // created source. It might be useful to access it in a callback
  // via 'getCurrentSource'.
  currentSource: null,
  files: [],
  mapper: null,
  sceneItem: null,
  stepFinishedCallback: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'baseUrl',
    'files',
    'mapper',
    'sceneItem',
    'stepFinishedCallback',
  ]);

  macro.get(publicAPI, model, ['currentSource']);

  // Object specific methods
  vtkHttpDataSetLODsLoader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkHttpDataSetLODsLoader'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
