import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import {
  View,
  KeyboardAvoidingView,
  Modal,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform
} from "react-native";
import styles from "./style";

const SUPPORTED_ORIENTATIONS = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right"
];

class RBSheet extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      contentVisible: false,
      translateY: new Animated.Value(props.height),
    };

    this.createPanResponder(props);
  }

  setModalVisible(visible, props) {
    const { height, minClosingHeight, onClose, onOpen } = this.props;
    const { translateY } = this.state;
    if (visible) {
      this.setState({ modalVisible: visible, contentVisible: visible }, () => {
        if (typeof onOpen === "function") onOpen(props);
        Animated.spring(translateY, {
          useNativeDriver: true,
          toValue: 0,
          tension: Platform.OS === 'ios' ? 35 : 25
        }).start();
      });
    } else {
      Animated.spring(translateY, {
        useNativeDriver: true,
        toValue: height,
        tension: 30,
        overshootClamping: true,
      }).start(() => {
          this.setState({ contentVisible: false }, () => {
            translateY.setValue(height);
            this.setState({ modalVisible: visible }, () => {
              if (typeof onClose === "function") onClose(props);
            });
          })
      });
    }
  }

  createPanResponder(props) {
    const { closeOnDragDown, height } = props;
    const { translateY } = this.state;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => closeOnDragDown,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          Animated.event([null, { dy: translateY }])(e, gestureState);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (height / 4 - gestureState.dy < 0) {
          this.setModalVisible(false);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  open(props) {
    requestAnimationFrame(() => {
      this.setModalVisible(true, props);
    });
  }

  close(props) {
    this.setModalVisible(false, props);
  }

  render() {
    const {
      height,
      animationType,
      closeOnDragDown,
      closeOnPressMask,
      closeOnPressBack,
      children,
      customStyles,
      keyboardAvoidingViewEnabled,
    } = this.props;
    const { translateY, modalVisible, contentVisible } = this.state;

    const opacity = translateY.interpolate({
      inputRange: [0, height],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Modal
        transparent
        hardwareAccelerated
        animationType={animationType}
        visible={modalVisible}
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onRequestClose={() => {
          if (closeOnPressBack) this.setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          enabled={keyboardAvoidingViewEnabled}
          behavior="padding"
          style={[styles.wrapper, customStyles.wrapper]}
        >
          {contentVisible && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[{ opacity }, styles.back]}
              />
              <TouchableOpacity
                style={styles.mask}
                activeOpacity={1}
                onPress={() => (closeOnPressMask ? this.close() : null)}
              />
              <Animated.View
                {...this.panResponder.panHandlers}
                style={[
                  styles.container,
                  { height, transform: [{ translateY }] },
                  customStyles.container,
                ]}
              >
                {closeOnDragDown && (
                  <View style={styles.draggableContainer}>
                    <View
                      style={[styles.draggableIcon, customStyles.draggableIcon]}
                    />
                  </View>
                )}
                {children}
              </Animated.View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

RBSheet.propTypes = {
  animationType: PropTypes.oneOf(["none", "slide", "fade"]),
  height: PropTypes.number,
  minClosingHeight: PropTypes.number,
  duration: PropTypes.number,
  closeOnDragDown: PropTypes.bool,
  closeOnPressMask: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  keyboardAvoidingViewEnabled: PropTypes.bool,
  customStyles: PropTypes.objectOf(PropTypes.object),
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  children: PropTypes.node,
};

RBSheet.defaultProps = {
  animationType: "none",
  height: 260,
  minClosingHeight: 0,
  duration: 300,
  closeOnDragDown: false,
  closeOnPressMask: true,
  closeOnPressBack: true,
  keyboardAvoidingViewEnabled: Platform.OS === "ios",
  customStyles: {},
  onClose: null,
  onOpen: null,
  children: <View />,
};

export default RBSheet;
