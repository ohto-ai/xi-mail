// 管理员判定：配置中的主管理员邮箱，或用户身份被设为 0（管理员）
export function isAdminUser(env, userRow) {
	return !!userRow && (userRow.email === env.admin || Number(userRow.type) === 0);
}
