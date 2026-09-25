import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator để lấy user từ request.
 * Sử dụng: @CurrentUser() user trong controller method parameter.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
