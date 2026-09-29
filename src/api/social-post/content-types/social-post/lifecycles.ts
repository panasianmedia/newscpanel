function dispatchAfterCommit(socialPostId: number | string, action: string) {
  void strapi.db
    .transaction(({ onCommit }: any) => {
      onCommit(() => {
        setImmediate(async () => {
          try {
            await strapi.service('api::social-post.social-post').dispatch(socialPostId);
          } catch (error) {
            strapi.log.error(`[Social Dispatcher] Error on ${action} for ID ${socialPostId}:`, error);
          }
        });
      });
    })
    .catch((error: unknown) => {
      strapi.log.error(`[Social Dispatcher] Could not schedule ${action} for ID ${socialPostId}:`, error);
    });
}

export default {
  afterCreate(event: any) {
    const { result } = event;
    if (result.status === 'ready_to_post') {
      dispatchAfterCommit(result.id, 'create');
    }
  },

  afterUpdate(event: any) {
    const { result } = event;
    if (event.params.data?.status === 'ready_to_post' && result.status === 'ready_to_post') {
      dispatchAfterCommit(result.id, 'update');
    }
  },
};