/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

// import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const WHITE = [1, 1, 1];
const GREEN = [0.1, 0.8, 0.1];

// ----------------------------------------------------------------------------
// Create 4 objects
// - sphere
// - sphere rendered as big points (square)
// - cone
// - cylinder with sphere as point (glyph mapper: source=cylinder, glyph=sphere)
// ----------------------------------------------------------------------------

// Sphere -------------------------------------------------

const sphereSource = vtkSphereSource.newInstance({
  phiResolution: 30,
  thetaResolution: 30,
});
const sphereMapper = vtkMapper.newInstance();
const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphereMapper);
sphereMapper.setInputConnection(sphereSource.getOutputPort());

// Sphere with point representation -----------------------

const spherePointsSource = vtkSphereSource.newInstance({
  phiResolution: 15,
  thetaResolution: 15,
  radius: 0.6,
});
const spherePointsMapper = vtkMapper.newInstance();
const spherePointsActor = vtkActor.newInstance();
spherePointsActor.setMapper(spherePointsMapper);
spherePointsMapper.setInputConnection(spherePointsSource.getOutputPort());

// Use point representation
spherePointsActor.getProperty().setRepresentation(Representation.POINTS);
spherePointsActor.getProperty().setPointSize(20);

// Cone ---------------------------------------------------

const coneSource = vtkConeSource.newInstance({ resolution: 20 });
const coneMapper = vtkMapper.newInstance();
const coneActor = vtkActor.newInstance();
coneActor.setMapper(coneMapper);
coneMapper.setInputConnection(coneSource.getOutputPort());

// Cylinder -----------------------------------------------

const cylinderSource = vtkCylinderSource.newInstance({
  resolution: 10,
  radius: 0.4,
  height: 0.6,
  direction: [1.0, 0.0, 0.0],
});
const cylinderMapper = vtkGlyph3DMapper.newInstance({
  scaling: true,
  scaleFactor: 0.25,
  scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
  scaleArray: 'scale',
});
const cylinderActor = vtkActor.newInstance();
const cylinderGlyph = sphereSource.getOutputData();
const cylinderPointSet = cylinderSource.getOutputData();
cylinderActor.setMapper(cylinderMapper);
cylinderMapper.setInputData(cylinderPointSet, 0);
cylinderMapper.setInputData(cylinderGlyph, 1);

// Add fields to cylinderPointSet
const scaleArray = new Float32Array(cylinderPointSet.getNumberOfPoints());
scaleArray.fill(0.5);
cylinderPointSet.getPointData().addArray(
  vtkDataArray.newInstance({
    name: 'scale',
    values: scaleArray,
  })
);

// ----------------------------------------------------------------------------
// Create rendering infrastructure
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = renderer.getRenderWindow();
const interactor = renderWindow.getInteractor();
const openGLRenderWindow = interactor.getView();

renderer.addActor(sphereActor);
renderer.addActor(spherePointsActor);
renderer.addActor(coneActor);
renderer.addActor(cylinderActor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Create hardware selector
// ----------------------------------------------------------------------------

const hardwareSelector = vtkOpenGLHardwareSelector.newInstance();
hardwareSelector.setFieldAssociation(
  FieldAssociations.FIELD_ASSOCIATION_POINTS
);
hardwareSelector.attach(openGLRenderWindow, renderer);

// ----------------------------------------------------------------------------
// Create Mouse listener for picking on mouse move
// ----------------------------------------------------------------------------

function eventToWindowXY(event) {
  // We know we are full screen => window.innerXXX
  // Otherwise we can use pixel device ratio or else...
  const { clientX, clientY } = event;
  const [width, height] = openGLRenderWindow.getSize();
  const x = Math.round((width * clientX) / window.innerWidth);
  const y = Math.round(height * (1 - clientY / window.innerHeight)); // Need to flip Y
  return [x, y];
}

// ----------------------------------------------------------------------------

let needGlyphCleanup = false;
let lastProcessedActor = null;

function processSelections(selections) {
  renderer.getActors().forEach((a) => a.getProperty().setColor(...WHITE));

  if (!selections || selections.length === 0) {
    renderWindow.render();
    lastProcessedActor = null;
    return;
  }

  const { compositeID, prop } = selections[0].getProperties();

  if (lastProcessedActor === prop) {
    // Skip render call when nothing change
    return;
  }
  lastProcessedActor = prop;

  // Make the picked actor green
  prop.getProperty().setColor(...GREEN);

  // We hit the glyph, let's scale the picked glyph
  if (prop === cylinderActor) {
    scaleArray.fill(0.5);
    scaleArray[compositeID] = 0.7;
    cylinderPointSet.modified();
    needGlyphCleanup = true;
  } else if (needGlyphCleanup) {
    needGlyphCleanup = false;
    scaleArray.fill(0.5);
    cylinderPointSet.modified();
  }

  // Update picture for the user so we can see the green one
  renderWindow.render();
}

// ----------------------------------------------------------------------------

function pickOnMouseEvent(event) {
  if (interactor.isAnimating()) {
    // We should not do picking when interating with the scene
    return;
  }
  const [x, y] = eventToWindowXY(event);
  hardwareSelector.setArea(x, y, x, y);
  hardwareSelector.releasePixBuffers();

  if (hardwareSelector.captureBuffers()) {
    processSelections(hardwareSelector.generateSelection(x, y, x, y));
  } else {
    processSelections(null);
  }
}

document.addEventListener('mousemove', pickOnMouseEvent);
