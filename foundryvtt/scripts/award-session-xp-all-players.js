(async () => {
  if (!game.user?.isGM) {
    ui.notifications.warn('Only the GM can run the session XP award macro.');
    return;
  }

  if (!game.legends?.progression?.showAwardPartyXPDialog) {
    ui.notifications.error('Legends progression tools are not available yet.');
    return;
  }

  await game.legends.progression.showAwardPartyXPDialog();
})();