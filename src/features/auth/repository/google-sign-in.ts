export type GoogleConfiguration = { webClientId?: string; iosClientId?: string; iosUrlScheme?: string };

export function googleConfigurationReady(platform: string, configuration: GoogleConfiguration): boolean {
  if (platform === 'android') return Boolean(configuration.webClientId);
  if (platform === 'ios') return Boolean(configuration.webClientId && configuration.iosClientId && configuration.iosUrlScheme);
  return false;
}

type GoogleDependencies<T> = {
  request: () => Promise<{ type: 'cancelled' } | { type: 'success'; data: { idToken: string | null } }>;
  exchange: (idToken: string) => Promise<T>;
};

export async function performGoogleSignIn<T>(dependencies: GoogleDependencies<T>): Promise<T | null> {
  const response = await dependencies.request();
  if (response.type === 'cancelled') return null;
  if (!response.data.idToken) throw Object.assign(new Error('Missing Google identity token'), { code: 'auth/missing-identity-token' });
  return dependencies.exchange(response.data.idToken);
}

export function createAuthQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const result = tail.then(operation);
    tail = result.catch(() => undefined);
    return result;
  };
}
