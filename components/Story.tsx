import React, {PureComponent} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  Value,
  interpolate,
  Extrapolate,
  concat,
  cond,
  and,
  greaterOrEq,
  lessThan,
} from 'react-native-reanimated';

import Interactable from './Interactable';

const {height: wH, width} = Dimensions.get('window');

const height = wH + StatusBar.currentHeight;
const isAndroid = Platform.OS === 'android';

const backPerspective = {perspective: isAndroid ? 9999 : -1000};
const frontPerspective = {perspective: isAndroid ? 9999 : 1000};

interface StoryProps {
  front: string;
  back: string;
  onSnap: (id: number) => void;
  bottom?: boolean;
  right?: boolean;
  isVertical?: boolean;
}

interface StoryState {
  isDragging: boolean;
}

const getTopStyles = (vertical, rotate, coef, opacity) => {
  const commonStyles = {
    backfaceVisibility: 'hidden',
    opacity,
  };

  const verticalStyle = {
    transform: [
      frontPerspective,
      {translateY: (coef * height) / 4},
      {rotateX: rotate},
      {translateY: (coef * -height) / 4},
    ],
  };

  const horizontalStyle = {
    transform: [
      frontPerspective,
      {translateX: (coef * width) / 4},
      {rotateY: rotate},
      {translateX: (coef * -width) / 4},
    ],
  };

  const dirStyle = vertical ? verticalStyle : horizontalStyle;

  return {...commonStyles, ...dirStyle};
};

const getBottomStyles = (vertical, rotate, rotateAsDeg, coef, opacity) => {
  const backOpacity = Platform.OS === 'android' ? cond(opacity, 0, 1) : 1;

  const horizontalStyles = {
    opacity: backOpacity,
    transform: [
      backPerspective,
      {rotateX: '180deg'},
      {translateX: (coef * width) / 4},
      {rotateY: rotate},
      {translateX: (coef * -width) / 4},
      {rotateZ: '180deg'},
    ],
  };

  const verticalStyles = {
    opacity: backOpacity,
    transform: [
      backPerspective,
      {rotateY: '180deg'},
      {translateY: (coef * height) / 4},
      {rotateX: rotate},
      {translateY: (coef * -height) / 4},
      {rotateZ: '180deg'},
    ],
  };

  return vertical ? verticalStyles : horizontalStyles;
};

export default class Story extends PureComponent<StoryProps, StoryState> {
  static defaultProps = {
    isVertical: true,
    bottom: false,
  };

  state = {
    isDragging: false,
  };

  y = new Value(0);
  x = new Value(0);

  onDrag = () => {
    const {isDragging} = this.state;
    if (!isDragging) {
      this.setState({isDragging: !isDragging});
    }
  };

  onSnap = ({nativeEvent: {id}}: {nativeEvent: {id: number}}) => {
    this.props.onSnap(id);
  };

  getInterpolation = () => {
    const {y, x} = this;
    const {isVertical} = this.props;

    if (isVertical) {
      const topInterpolation = interpolate(y, {
        inputRange: [0, height],
        outputRange: [0, -180],
        extrapolate: Extrapolate.CLAMP,
      });
      const bottomInterpolation = interpolate(y, {
        inputRange: [-height, 0],
        outputRange: [180, 0],
        extrapolate: Extrapolate.CLAMP,
      });
      return {top: topInterpolation, bottom: bottomInterpolation};
    } else {
      const topInterpolation = interpolate(x, {
        inputRange: [0, width],
        outputRange: [0, 180],
        extrapolate: Extrapolate.CLAMP,
      });
      const bottomInterpolation = interpolate(x, {
        inputRange: [-width, 0],
        outputRange: [-180, 0],
        extrapolate: Extrapolate.CLAMP,
      });
      return {top: topInterpolation, bottom: bottomInterpolation};
    }
  };

  getSnapPoints = () => {
    const {isVertical} = this.props;
    const topLeftSnapPoints = isVertical
      ? [
          {id: 0, y: 0},
          {id: -1, y: height},
        ]
      : [
          {id: 0, x: 0},
          {id: -1, x: width},
        ];
    const bottomRightSnapPoints = isVertical
      ? [
          {id: 1, y: -height},
          {id: 0, y: 0},
        ]
      : [
          {id: 1, x: -width},
          {id: 0, x: 0},
        ];
    return {top: topLeftSnapPoints, bottom: bottomRightSnapPoints};
  };

  renderPart = (part, style) => {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        {/* <DirectionItem dir={right} /> */}
        <Image source={{uri: part}} style={styles.image} />
      </Animated.View>
    );
  };

  render() {
    const {y, x, onDrag, onSnap} = this;
    const {front, back, bottom, isVertical} = this.props;
    const {isDragging} = this.state;

    const topInterpolation = this.getInterpolation().top;
    const bottomInterpolation = this.getInterpolation().bottom;

    const rotateXAsDeg = bottom ? bottomInterpolation : topInterpolation;
    const rotateX = concat(rotateXAsDeg, 'deg');

    const topSnapPoints = this.getSnapPoints().top;
    const bottomSnapPoints = this.getSnapPoints().bottom;

    const snapPoints = bottom ? bottomSnapPoints : topSnapPoints;

    const opacity =
      Platform.OS === 'android'
        ? cond(
            and(greaterOrEq(rotateXAsDeg, -90), lessThan(rotateXAsDeg, 90)),
            1,
            0,
          )
        : 1;

    const coef = bottom ? -1 : 1;

    const bottomStyles = getBottomStyles(
      isVertical,
      rotateX,
      rotateXAsDeg,
      coef,
      opacity,
    );
    const topStyles = getTopStyles(isVertical, rotateX, coef, opacity);
    const zIndex = isAndroid ? 'elevation' : 'zIndex';

    const containerStyle = [styles.container, {[zIndex]: isDragging ? 1 : 0}];

    return (
      <View style={containerStyle}>
        {this.renderPart(back, bottomStyles)}
        {this.renderPart(front, topStyles)}

        <Interactable.View
          verticalOnly={isVertical}
          horizontalOnly={!isVertical}
          animatedValueY={y}
          animatedValueX={x}
          {...{snapPoints, onDrag, onSnap, style: styles.interactableStyle}}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    // resizeMode: 'cover',
  },
  interactableStyle: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: 'rgba(100,200,300, 0.5)',
  },
});
