import { BatchResult } from './batch-processor';

export interface BatchReport {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  successRate: number;
  totalTime: number;
  averageTime: number;
  results: BatchResult[];
}

export class BatchProgressReporter {
  private startTime: Date;
  private totalJobs: number;
  private completedJobs: number = 0;
  private failedJobs: number = 0;
  private results: BatchResult[] = [];

  constructor(totalJobs: number) {
    this.totalJobs = totalJobs;
    this.startTime = new Date();
  }

  reportProgress(result: BatchResult): void {
    this.results.push(result);

    if (result.success) {
      this.completedJobs++;
    } else {
      this.failedJobs++;
    }

    this.printProgress();
  }

  private printProgress(): void {
    const processed = this.completedJobs + this.failedJobs;
    const percentage = Math.round((processed / this.totalJobs) * 100);
    const elapsed = Date.now() - this.startTime.getTime();
    const rate = processed / (elapsed / 1000);
    const eta = processed > 0 ? Math.round((this.totalJobs - processed) / rate) : 0;

    console.log(
      `Progress: ${ processed }/${ this.totalJobs } (${ percentage }%) | ` +
      `✅ ${ this.completedJobs } ❌ ${ this.failedJobs } | ` +
      `Rate: ${ rate.toFixed(1) }/s | ETA: ${ eta }s`
    );
  }

  getFinalReport(): BatchReport {
    const totalTime = Date.now() - this.startTime.getTime();

    return {
      totalJobs: this.totalJobs,
      completedJobs: this.completedJobs,
      failedJobs: this.failedJobs,
      successRate: this.totalJobs > 0 ? (this.completedJobs / this.totalJobs) * 100 : 0,
      totalTime,
      averageTime: this.totalJobs > 0 ? totalTime / this.totalJobs : 0,
      results: this.results
    };
  }

  printFinalReport(): void {
    const report = this.getFinalReport();
    const duration = (report.totalTime / 1000).toFixed(1);

    console.log('\n📊 Batch Processing Complete');
    console.log(`Total: ${ report.totalJobs }`);
    console.log(`✅ Successful: ${ report.completedJobs }`);
    console.log(`❌ Failed: ${ report.failedJobs }`);
    console.log(`Success Rate: ${ report.successRate.toFixed(1) }%`);
    console.log(`Total Time: ${ duration }s`);
    console.log(`Average Time per Job: ${ (report.averageTime / 1000).toFixed(2) }s`);

    // Show failed jobs
    const failedResults = report.results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('\n❌ Failed Jobs:');
      failedResults.forEach(result => {
        console.log(`  • ${ result.file }: ${ result.error }`);
      });
    }
  }

  getProgressPercentage(): number {
    const processed = this.completedJobs + this.failedJobs;
    return this.totalJobs > 0 ? Math.round((processed / this.totalJobs) * 100) : 0;
  }

  isComplete(): boolean {
    return (this.completedJobs + this.failedJobs) >= this.totalJobs;
  }

  reset(): void {
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.results = [];
    this.startTime = new Date();
  }
}
