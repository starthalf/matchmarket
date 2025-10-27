import { Platform, Alert } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export class CrossPlatformAlert {
  static alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: any
  ): void {
    if (Platform.OS === 'web') {
      this.webAlert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons, options);
    }
  }

  private static webAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ): void {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length === 0) {
      window.alert(fullMessage);
      return;
    }

    if (buttons.length === 1) {
      window.alert(fullMessage);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
      return;
    }

    const confirmButton = buttons.find(btn =>
      btn.style !== 'cancel' && btn.style !== 'destructive'
    ) || buttons.find(btn => btn.style === 'destructive') || buttons[buttons.length - 1];

    const result = window.confirm(fullMessage);

    if (result) {
      if (confirmButton.onPress) {
        confirmButton.onPress();
      }
    } else {
      const cancelButton = buttons.find(btn => btn.style === 'cancel');
      if (cancelButton?.onPress) {
        cancelButton.onPress();
      }
    }
  }
}
