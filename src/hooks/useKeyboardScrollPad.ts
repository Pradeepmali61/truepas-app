import { useCallback, useEffect, useRef } from 'react';
import {
    Keyboard,
    ScrollView,
    TextInput,
    View,
    type GestureResponderEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';

/**
 * Android edge-to-edge doesn't resize the window for the keyboard, so the
 * KeyboardAvoidingView("height") shrinks the layout — and RN's auto-scroll
 * leaves the focused input's bottom edge tucked under the sticky footer CTA.
 * This hook nudges the ScrollView so the focused input clears the footer.
 *
 *   const kbd = useKeyboardScrollPad();
 *   <ScrollView {...kbd.scrollProps} …>
 *   <View {...kbd.footerProps}> …CTA…
 */
export function useKeyboardScrollPad(gap = 12) {
  const scrollRef = useRef<ScrollView>(null);
  const footerRef = useRef<View>(null);
  const offsetY = useRef(0);
  const keyboardOpen = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastField = useRef<unknown>(null);

  const nudge = useCallback(() => {
    if (!keyboardOpen.current) return;
    const input = TextInput.State.currentlyFocusedInput() as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    } | null;
    input?.measureInWindow?.((_x, y, _w, h) => {
      footerRef.current?.measureInWindow((_fx, fy) => {
        const delta = y + h - (fy - gap);
        if (delta > 0.5) {
          scrollRef.current?.scrollTo({ y: offsetY.current + delta, animated: true });
        }
      });
    });
  }, [gap]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(nudge, 200);
  }, [nudge]);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;
    const show = Keyboard.addListener('keyboardDidShow', () => {
      keyboardOpen.current = true;
      schedule();
      // Focus can move between fields while the keyboard stays open and RN
      // emits no event for that — poll for a field change to re-nudge.
      poll = setInterval(() => {
        const focused = TextInput.State.currentlyFocusedInput();
        if (focused !== lastField.current) {
          lastField.current = focused;
          schedule();
        }
      }, 250);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardOpen.current = false;
      lastField.current = null;
      if (poll) clearInterval(poll);
    });
    return () => {
      show.remove();
      hide.remove();
      if (poll) clearInterval(poll);
    };
  }, [schedule]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onTouchEnd = useCallback((_e: GestureResponderEvent) => schedule(), [schedule]);

  return {
    scrollProps: { ref: scrollRef, onScroll, onTouchEnd, scrollEventThrottle: 16 },
    footerProps: { ref: footerRef },
  };
}
