import React, {PureComponent} from 'react';
import {View, Image, StyleSheet} from 'react-native';

interface BackgroundImageProps {
  top: string;
  bottom: string;
  left: string;
  right: string;
  isVertical: boolean;
}

export default class BackgroundImage extends PureComponent<
  BackgroundImageProps
> {
  renderPart = (part) => {
    return (
      <View style={styles.container}>
        <Image source={{uri: part}} style={styles.image} />
      </View>
    );
  };

  render() {
    const {top, bottom, left, right, isVertical} = this.props;

    const flexDirection = isVertical ? 'column' : 'row';
    const firstPart = isVertical ? top : left;
    const secondPart = isVertical ? bottom : right;
    return (
      <View style={[StyleSheet.absoluteFill, {flexDirection}]}>
        {this.renderPart(firstPart)}
        {this.renderPart(secondPart)}
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
    resizeMode: 'cover',
  },
});
