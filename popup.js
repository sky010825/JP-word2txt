document.getElementById("extractReadingBtn").addEventListener("click", () => {

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        chrome.tabs.sendMessage(tab.id, {
            action: "export",
            mode: "reading"
        });

    });

});

document.getElementById("extractKrjpBtn").addEventListener("click", () => {

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        chrome.tabs.sendMessage(tab.id, {
            action: "export",
            mode: "krjp"
        });

    });

});