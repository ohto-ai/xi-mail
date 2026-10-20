import settingService from './setting-service';
import jwtUtils from '../utils/jwt-utils';
import domainUtils from '../utils/domain-uitls';

function escapeHtml(value) {
	return String(value ?? '').replace(/[&<>"']/g, ch => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	}[ch]));
}

const pushplusService = {

	async sendEmail(c, emailRow, settings) {

		try {

			const setting = settings || await settingService.query(c);
			const { pushplusStatus, pushplusToken, customDomain } = setting;

			// 0 = 开启，1 = 关闭
			if (Number(pushplusStatus) !== 0 || !pushplusToken) {
				return;
			}

			const subject = emailRow.subject || '(无主题)';
			const title = `新邮件：${subject}`.slice(0, 100);

			let link = '';
			if (customDomain) {
				const token = await jwtUtils.generateToken(c, { emailId: emailRow.emailId }, 60 * 60 * 24 * 7);
				link = `${domainUtils.toOssDomain(customDomain)}/api/email/view/${token}`;
			}

			const content = `
				<div style="font-size:14px;line-height:1.7;color:#222">
					<p style="font-size:16px;font-weight:600;margin:0 0 10px">${escapeHtml(subject)}</p>
					<p style="margin:4px 0"><b>发件人：</b>${escapeHtml(emailRow.name || '')} &lt;${escapeHtml(emailRow.sendEmail || '')}&gt;</p>
					<p style="margin:4px 0"><b>收件人：</b>${escapeHtml(emailRow.toEmail || '')}</p>
					<p style="margin:4px 0"><b>时间：</b>${escapeHtml(emailRow.createTime || new Date().toISOString())}</p>
					${link ? `<p style="margin:14px 0 0"><a href="${escapeHtml(link)}">查看邮件</a></p>` : ''}
				</div>
			`;

			const res = await fetch('https://www.pushplus.plus/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: pushplusToken,
					title,
					content,
					template: 'html',
					channel: 'wechat'
				})
			});

			const data = await res.json().catch(() => null);

			if (!res.ok || data?.code !== 200) {
				console.error('PushPlus 推送失败', res.status, JSON.stringify(data));
			}

		} catch (e) {
			console.error('PushPlus 推送异常', e);
		}

	}

};

export default pushplusService;
