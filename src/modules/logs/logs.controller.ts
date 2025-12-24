import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Paginate, QueryOptions } from '../../common/query-options';
import { LogsService } from './logs.service';

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List logs',
    description: 'Get paginated list of system logs',
  })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  findAll(@Paginate() query: QueryOptions) {
    return this.logsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get log',
    description: 'Retrieve a specific log by ID',
  })
  @ApiResponse({ status: 200, description: 'Log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  findOne(@Param('id') id: string) {
    return this.logsService.findById(id);
  }
}
