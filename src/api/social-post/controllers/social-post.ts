/**
 * social-post controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::social-post.social-post', ({ strapi }) => ({
  async dispatchPost(ctx) {
    const { id } = ctx.params;
    try {
      const data = await strapi.service('api::social-post.social-post').dispatch(id);
      return ctx.send({ success: true, data });
    } catch (err: any) {
      return ctx.badRequest(err.message, { details: err });
    }
  },
}));