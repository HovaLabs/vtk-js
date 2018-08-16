import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

// ----------------------------------------------------------------------------
// vtkStateObserver methods
// ----------------------------------------------------------------------------

// Should only be used by AbstractWidget and AbstractRepresentation.
// As such, this will not be exported out for public use.
function vtkStateObserver(publicAPI, model) {
  model.state = null;
  model.subscription = null;

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  // Virtual method
  // This should be used to detect whenever a state changed.
  publicAPI.onStateChanged = (newState) => {};

  //----------------------------------------------------------------------------

  // Accepts: vtkWidgetState, object
  // If input is a regular object, then current state is updated by the object
  publicAPI.updateWidgetState = (newState) => {
    if (!newState) {
      return;
    }

    if (
      !newState ||
      (newState && newState.isA && newState.isA('vtkWidgetState'))
    ) {
      if (newState === model.state) {
        return;
      }

      if (model.subscription) {
        model.subscription.unsubscribe();
        model.subscription = null;
      }

      model.state = newState;

      if (newState) {
        // don't directly bind onStateChanged as callback,
        // since we want it to be overridden by users of StateObserver.
        model.subscription = newState.onModified((o) =>
          publicAPI.onStateChanged(o)
        );
        // trigger state change
        publicAPI.onStateChanged(newState);
      }
    } else if (model.state) {
      model.state.updateData(newState);
    }

    publicAPI.modified();
  };

  //----------------------------------------------------------------------------

  publicAPI.getWidgetState = () => model.state;

  //----------------------------------------------------------------------------

  publicAPI.updateWidgetState(vtkWidgetState.newInstance());
}

export default vtkStateObserver;
