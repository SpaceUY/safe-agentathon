export const safeFireAndForget = async <T>(callback: () => Promise<T>) => {
  try {
    await callback();
  } catch (e) {}
};
