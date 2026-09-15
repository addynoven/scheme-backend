import React from 'react';
import { Platform } from 'react-native';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export interface ExternalLinkProps extends Omit<React.ComponentProps<typeof Link>, 'href'> {
  readonly href: string;
}

export function ExternalLink({ href, onPress, ...restProps }: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...restProps}
      href={href as unknown as React.ComponentProps<typeof Link>['href']}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          void WebBrowser.openBrowserAsync(href);
        }
        onPress?.(e);
      }}
    />
  );
}
