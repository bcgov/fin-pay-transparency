import { de } from "@faker-js/faker";
import { getAnnouncements } from "./announcements-service";

describe('AnnouncementsService', () => {
    describe('getAnnouncements', () => {
        it('should return announcements', async () => {
            const announcements = await getAnnouncements();
            expect(announcements).toHaveLength(2);
        });
    });
});