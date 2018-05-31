const WidgetState = {
  IDLE: 0,
  CROPPING: 10,

  MOVE_LEFT: 1,
  MOVE_RIGHT: 2,
  MOVE_BOTTOM: 3,
  MOVE_TOP: 4,
  MOVE_LEFT_BOTTOM: 5,
  MOVE_LEFT_TOP: 6,
  MOVE_RIGHT_BOTTOM: 7,
  MOVE_RIGHT_TOP: 8,
};

const Orientation = {
  YZ: 0,
  XZ: 1,
  XY: 2,
};

const CropWidgetEvents = ['CroppingPlanesChanged'];

export default { WidgetState, CropWidgetEvents, Orientation };
