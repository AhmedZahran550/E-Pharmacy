import { ActivityLog } from '@/database/entities/activity-log.entity';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as requestIp from 'request-ip';
import { v4 as uuid } from 'uuid';
import { AuthUserDto } from '../modules/auth/dto/auth-user.dto';
import { LogsService } from '../modules/logs/logs.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private logService: LogsService) {}
  private logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api/logs')) {
      next(); // Skip logging and proceed to the next middleware or route handler
    }
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const uid = uuid();
    const startTime = Date.now();
    res.locals.requestId = uid;
    res.setHeader('requestId', uid);
    res.setHeader('serverDate', startTime);
    res.on('finish', () => {
      const finishTime = Date.now();
      // Set the Date header inside the finish event handler
      // res.setHeader('Date', finishTime);
      const { statusCode } = res;
      const elapsedTime = finishTime - startTime;
      const clientIp = requestIp.getClientIp(req);
      const userId = req.user ? (req.user as AuthUserDto).id : null;
      const resource = req.path.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        ':id',
      );
      const log: ActivityLog = {
        id: uid,
        clientIp,
        // user,
        resource,
        url: originalUrl,
        method,
        userAgent,
        requestTimeInMillis: elapsedTime,
        reqBody: JSON.stringify(req.body),
        statusCode: statusCode.toString(),
      };
      !!userId && (log.userId = userId);
      if (res.locals.error) {
        log.error = res.locals.error;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} ${elapsedTime}ms - ${clientIp} - ${userId || 'anonymous'}
          User-Agent: ${userAgent}`,
        );
      } else {
        this.logService.logAsync(log);
      }
    });
    next();
  }
}
