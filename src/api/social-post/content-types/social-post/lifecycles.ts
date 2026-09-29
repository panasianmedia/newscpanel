export default {
  async afterCreate(event: any) {
    const { result } = event;
    if (result.status === 'ready_to_post') {
      setImmediate(async () => {
        try {
          await strapi.service('api::social-post.social-post').dispatch(result.id);
        } catch (err) {
          strapi.log.error(`[Social Dispatcher] Error on create for ID ${result.id}:`, err);
        }
      });
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;
    if (event.params.data?.status === 'ready_to_post' && result.status === 'ready_to_post') {
      setImmediate(async () => {
        try {
          await strapi.service('api::social-post.social-post').dispatch(result.id);
        } catch (err) {
          strapi.log.error(`[Social Dispatcher] Error on update for ID ${result.id}:`, err);
        }
      });
    }
  },
};