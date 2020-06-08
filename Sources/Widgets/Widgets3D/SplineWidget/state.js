import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { splineKind } from 'vtk.js/Sources/Common/DataModel/Spline3D/Constants';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addField({ name: 'splineKind', initialValue: splineKind.KOCHANEK_SPLINE })
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'moveHandle',
      initialValues: {
        scale1: 0.05,
        origin: [-1, -1, -1],
        visible: false,
      },
    })
    .addDynamicMixinState({
      labels: ['handles'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'handle',
      initialValues: {
        scale1: 0.05,
        origin: [-1, -1, -1],
        visible: false,
      },
    })
    .build();
}
