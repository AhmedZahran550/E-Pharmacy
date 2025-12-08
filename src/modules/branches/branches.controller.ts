import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BRANCHES_PAGINATION_CONFIG,
  BranchesService,
} from './branches.service';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}
}
