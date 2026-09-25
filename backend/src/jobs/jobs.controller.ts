import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { CheckOverlapDto } from './dto/check-overlap.dto.js';
import { SyncGuestDto } from './dto/sync-guest.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * POST /jobs — Tạo job mới
   */
  @Post()
  async create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(userId, dto);
  }

  /**
   * POST /jobs/sync-guest — Đồng bộ jobs từ Chế độ Khách (Guest Mode)
   */
  @Post('sync-guest')
  async syncGuest(
    @CurrentUser('userId') userId: number,
    @Body() dto: SyncGuestDto,
  ) {
    return this.jobsService.syncGuest(userId, dto);
  }

  /**
   * GET /jobs?date=YYYY-MM-DD — Lấy danh sách job theo ngày
   */
  @Get()
  async findByDate(
    @CurrentUser('userId') userId: number,
    @Query('date') date: string,
  ) {
    return this.jobsService.findByDate(userId, date);
  }

  /**
   * GET /jobs/range?from=YYYY-MM-DD&to=YYYY-MM-DD — Lấy job theo khoảng ngày
   */
  @Get('range')
  async findByRange(
    @CurrentUser('userId') userId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.jobsService.findByRange(userId, from, to);
  }

  /**
   * POST /jobs/check-overlap — Kiểm tra trùng giờ (real-time)
   */
  @Post('check-overlap')
  async checkOverlap(
    @CurrentUser('userId') userId: number,
    @Body() dto: CheckOverlapDto,
  ) {
    return this.jobsService.checkOverlap(userId, dto);
  }

  /**
   * GET /jobs/:id — Xem chi tiết 1 job
   */
  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.findOne(userId, id);
  }

  /**
   * PATCH /jobs/:id — Sửa job
   */
  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(userId, id, dto);
  }

  /**
   * DELETE /jobs/:id — Xoá job
   */
  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.remove(userId, id);
  }
}
