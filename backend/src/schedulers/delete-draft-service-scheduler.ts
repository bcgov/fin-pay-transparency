import { CronJob } from 'cron';
import { config } from '../config';
import { schedulerService } from '../v1/services/scheduler-service';

const job = new CronJob(
	config.get('server:schedulerDeleteDraftCronTime'), // cronTime
	async function () {
    	await schedulerService.getDraftReports();
	}, // onTick
	null, // onComplete
	true, // start
	'America/Los_Angeles' // timeZone
);