chrome.commands.onCommand.addListener(async (command) => {

    if (command !== "save-word") return;

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(tab.id, {
        action: "saveWord"
    });

});