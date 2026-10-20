import orm from '../entity/orm';
import email from '../entity/email';
import settingService from './setting-service';
import jwtUtils from '../utils/jwt-utils';
import emailTextTemplate from '../template/email-text';
import emailHtmlTemplate from '../template/email-html';
import { eq } from 'drizzle-orm';

const emailViewService = {

	async getEmailContent(c, params) {

		const { token } = params;

		const result = await jwtUtils.verifyToken(c, token);

		if (!result) {
			return emailTextTemplate('Access denied');
		}

		const emailRow = await orm(c).select().from(email).where(eq(email.emailId, result.emailId)).get();

		if (emailRow) {
			if (emailRow.content) {
				const { r2Domain } = await settingService.query(c);
				return emailHtmlTemplate(emailRow.content || '', r2Domain);
			} else {
				return emailTextTemplate(emailRow.text || '');
			}
		} else {
			return emailTextTemplate('The email does not exist');
		}
	}

};

export default emailViewService;
