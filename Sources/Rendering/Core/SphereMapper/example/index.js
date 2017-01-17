import vtkActor                         from '../../../../../Sources/Rendering/Core/Actor';
import vtkCalculator                    from '../../../../../Sources/Filters/General/Calculator';
import vtkFullScreenRenderWindow        from '../../../../../Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPlaneSource                   from '../../../../../Sources/Filters/Sources/PlaneSource';
import vtkSphereMapper                  from '../../../../../Sources/Rendering/Core/SphereMapper';

import { AttributeTypes }               from '../../../../../Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes }               from '../../../../../Sources/Common/DataModel/DataSet/Constants';
import { Representation }               from '../../../../../Sources/Rendering/Core/Property/Constants';

import controlPanel                     from './controlPanel.html';


// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();


// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const planeSource = vtkPlaneSource.newInstance();
const simpleFilter = vtkCalculator.newInstance();
const mapper = vtkSphereMapper.newInstance();
const actor = vtkActor.newInstance();

actor.getProperty().setRepresentation(Representation.WIREFRAME); // ??? Is this useful?

simpleFilter.setFormula({
  getArrays: inputDataSets => ({
    input: [
      { location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
    output: [ // Generate two output arrays:
      {
        location: FieldDataTypes.POINT,   // This array will be point-data ...
        name: 'pressure',                // ... with the given name ...
        dataType: 'Float32Array',         // ... of this type ...
        numberOfComponents: 1,            // ... with this many components ...
      },
      {
        location: FieldDataTypes.POINT, // This array will be field data ...
        name: 'temperature',                   // ... with the given name ...
        dataType: 'Float32Array',         // ... of this type ...
        attribute: AttributeTypes.SCALARS, // ... and will be marked as the default scalars.
        numberOfComponents: 1,            // ... with this many components ...
      },
    ] }),
  evaluate: (arraysIn, arraysOut) => {
    // Convert in the input arrays of vtkDataArrays into variables
    // referencing the underlying JavaScript typed-data arrays:
    const [coords] = arraysIn.map(d => d.getData());
    const [press, temp] = arraysOut.map(d => d.getData());

    // Since we are passed coords as a 3-component array,
    // loop over all the points and compute the point-data output:
    for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
      press[i] = (((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5)) + ((coords[(3 * i) + 1] - 0.5) * (coords[(3 * i) + 1] - 0.5)) + 0.125) * 0.1;
      temp[i] = coords[(3 * i) + 1];
    }
    // Mark the output vtkDataArray as modified
    arraysOut.forEach(x => x.modified());
  },
});

/*
simpleFilter.setFormulaSimple(
  FieldDataTypes.POINT, // Generate an output array defined over points.
  [],  // We don't request any point-data arrays because point coordinates are made available by default.
  'pressure', // Name the output array "pressure"
  x => (((x[0] - 0.5) * (x[0] - 0.5)) + ((x[1] - 0.5) * (x[1] - 0.5)) + 0.125) * 0.1
); // Our formula for pressure
*/

// The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
simpleFilter.setInputConnection(planeSource.getOutputPort());

mapper.setInputConnection(simpleFilter.getOutputPort());
mapper.setScaleArray('pressure');

actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();


// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});


// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.planeSource = planeSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
