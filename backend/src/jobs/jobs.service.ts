import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { CheckOverlapDto } from './dto/check-overlap.dto.js';
import { SyncGuestDto } from './dto/sync-guest.dto.js';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo job mới.
   */
  async create(userId: number, dto: CreateJobDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);

    const job = await this.prisma.job.create({
      data: {
        userId,
        title: dto.title,
        date: new Date(dto.date),
        startTime: this.toTimeDate(dto.startTime),
        endTime: this.toTimeDate(dto.endTime),
        note: dto.note || null,
        cost: dto.cost ?? null,
        paid: dto.paid ?? false,
      },
    });

    return this.formatJob(job);
  }

  /**
   * Lấy danh sách job theo ngày.
   */
  async findByDate(userId: number, date: string) {
    const targetDate = new Date(date);

    const jobs = await this.prisma.job.findMany({
      where: {
        userId,
        date: targetDate,
      },
      orderBy: { startTime: 'asc' },
    });

    return jobs.map((job: any) => this.formatJob(job));
  }

  /**
   * Lấy danh sách job theo khoảng ngày (cho calendar view).
   */
  async findByRange(userId: number, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const jobs = await this.prisma.job.findMany({
      where: {
        userId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return jobs.map((job: any) => this.formatJob(job));
  }

  /**
   * Xem chi tiết 1 job.
   */
  async findOne(userId: number, jobId: number) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy công việc này');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem công việc này');
    }

    return this.formatJob(job);
  }

  /**
   * Cập nhật job.
   */
  async update(userId: number, jobId: number, dto: UpdateJobDto) {
    await this.findOne(userId, jobId);

    if (dto.startTime && dto.endTime) {
      this.validateTimeRange(dto.startTime, dto.endTime);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.startTime !== undefined) updateData.startTime = this.toTimeDate(dto.startTime);
    if (dto.endTime !== undefined) updateData.endTime = this.toTimeDate(dto.endTime);
    if (dto.note !== undefined) updateData.note = dto.note || null;
    if (dto.cost !== undefined) updateData.cost = dto.cost ?? null;
    if (dto.paid !== undefined) updateData.paid = dto.paid;

    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return this.formatJob(job);
  }

  /**
   * Xoá job.
   */
  async remove(userId: number, jobId: number) {
    await this.findOne(userId, jobId);

    await this.prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Đã xoá công việc' };
  }

  /**
   * Kiểm tra trùng lịch (overlap check).
   */
  async checkOverlap(userId: number, dto: CheckOverlapDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);

    const targetDate = new Date(dto.date);
    const newStart = this.toTimeDate(dto.startTime);
    const newEnd = this.toTimeDate(dto.endTime);

    const jobsOnDate = await this.prisma.job.findMany({
      where: {
        userId,
        date: targetDate,
        ...(dto.excludeJobId ? { id: { not: dto.excludeJobId } } : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    const overlapping = jobsOnDate.filter((job: any) => {
      return newStart < job.endTime && newEnd > job.startTime;
    });

    return {
      hasOverlap: overlapping.length > 0,
      overlappingJobs: overlapping.map((job: any) => this.formatJob(job)),
    };
  }

  /**
   * Đồng bộ hàng loạt jobs từ chế độ Khách (Guest Mode) lên tài khoản
   */
  async syncGuest(userId: number, dto: SyncGuestDto) {
    if (!dto.jobs || !dto.jobs.length) {
      return { count: 0, message: 'Không có dữ liệu cần đồng bộ' };
    }

    const created = [];
    for (const item of dto.jobs) {
      this.validateTimeRange(item.startTime, item.endTime);
      const job = await this.prisma.job.create({
        data: {
          userId,
          title: item.title,
          date: new Date(item.date),
          startTime: this.toTimeDate(item.startTime),
          endTime: this.toTimeDate(item.endTime),
          note: item.note || null,
          cost: item.cost ?? null,
          paid: item.paid ?? false,
        },
      });
      created.push(this.formatJob(job));
    }

    return {
      count: created.length,
      message: `Đã đồng bộ thành công ${created.length} công việc vào tài khoản`,
      jobs: created,
    };
  }

  // --- Helper methods ---

  private toTimeDate(timeStr: string): Date {
    return new Date(`1970-01-01T${timeStr}:00.000Z`);
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
    }
  }

  private formatJob(job: {
    id: number;
    userId: number;
    title: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    note: string | null;
    cost: any;
    paid: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: job.id,
      userId: job.userId,
      title: job.title,
      date: job.date.toISOString().split('T')[0],
      startTime: job.startTime.toISOString().substring(11, 16),
      endTime: job.endTime.toISOString().substring(11, 16),
      note: job.note,
      cost: job.cost != null ? Number(job.cost) : null,
      paid: job.paid,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
