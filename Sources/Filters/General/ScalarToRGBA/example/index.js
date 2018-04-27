import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageSliceFilter from 'vtk.js/Sources/Filters/General/ImageSliceFilter';
import vtkScalarToRGBA from 'vtk.js/Sources/Filters/General/ScalarToRGBA';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.5, 0.5, 0.5],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const dataRange = [45, 183];

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const lookupTable = vtkColorTransferFunction.newInstance();
const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');
lookupTable.applyColorMap(preset);
lookupTable.setMappingRange(...dataRange);
lookupTable.updateRange();

const piecewiseFunction = vtkPiecewiseFunction.newInstance();
piecewiseFunction.removeAllPoints();
piecewiseFunction.addPoint(dataRange[0], 0);
piecewiseFunction.addPoint((dataRange[0] + dataRange[1]) * 0.5, 0.1);
piecewiseFunction.addPoint(dataRange[1], 1);

const wavelet = vtkRTAnalyticSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

console.log(
  wavelet
    .getOutputData()
    .getPointData()
    .getScalars()
    .getRange()
);

const sliceFilter = vtkImageSliceFilter.newInstance({ sliceIndex: 10 });
sliceFilter.setInputConnection(wavelet.getOutputPort());

const rgbaFilter = vtkScalarToRGBA.newInstance();
rgbaFilter.setLookupTable(lookupTable);
rgbaFilter.setPiecewiseFunction(piecewiseFunction);
rgbaFilter.setInputConnection(sliceFilter.getOutputPort());

const texture = vtkTexture.newInstance();
texture.setInputConnection(rgbaFilter.getOutputPort());

const planeSource = vtkPlaneSource.newInstance();
mapper.setInputConnection(planeSource.getOutputPort());
actor.setMapper(mapper);
actor.addTexture(texture);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
