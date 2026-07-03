chrome.runtime.onMessage.addListener(async (message) => {

    console.log("MESSAGE RECEIVED:", message);

    if (message.action === "export") {
        await exportWordbook(message.mode);
        return;
    }

    if (message.action === "saveWord") {
        await saveWordMacro();
        return;
    }

});

async function exportWordbook(mode) {
    console.log("EXPORT START", mode);

    try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.split("?")[1]);
        const wbId = params.get("wbId");

        if (!wbId) {
            alert("wbId를 찾을 수 없습니다.");
            return;
        }

        let text = "#separator:tab\n#html:true\n#tags column:3\n";

        let page = 1;
        let totalPages = 1;

        do {
            const api =
                `https://learn.dict.naver.com/gateway-api/jakodict/mywordbook/word/list/search` +
                `?wbId=${wbId}&qt=0&st=0&page=${page}&page_size=20&domain=naver`;

            const response = await fetch(api, { credentials: "include" });
            const json = await response.json();

            totalPages = json?.data?.m_total_pages || 1;
            const items = json?.data?.m_items;

            if (!items) {
                console.error("m_items 없음:", json);
                break;
            }

            for (const item of items) {
                const data = JSON.parse(item.content);
                const kana = data.entry.members[0].entry_name;
                const kanji = data.entry.members[0].kanji || kana;
                let meaning = data.entry.means[0].show_mean;
                meaning = meaning.replace(/<[^>]*>/g, "").trim();

                text += formatLine(mode, kanji, kana, meaning);
            }

            page++;
        } while (page <= totalPages);

        downloadTxt(text, mode);

    } catch (e) {
        console.error("EXPORT ERROR:", e);
    }
}


function formatLine(mode, kanji, kana, meaning) {

    if (mode === "reading") {
        // 한자읽기
        return `${kanji}\t${kana}<br>${meaning}\n`;
    }

    if (mode === "krjp") {
        // 한일
        return `${meaning}\t${kanji}<br>${kana}\n`;
    }

    // fallback
    return `${kanji}\t${kana}<br>${meaning}\n`;
}

function downloadTxt(text, mode) {

    const filenameMap = {
        reading: "anki한자읽기.txt",
        krjp: "anki한일.txt"
    };

    const filename = filenameMap[mode] || "anki.txt";

    const blob = new Blob([text], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    alert("Export complete!");
}

async function saveWordMacro() {

    const returnToSearch = async () => {
        await new Promise(r => setTimeout(r, 300));

        const input = document.querySelector("#ac_input");

        if (input) {
            input.focus();
            input.value = "";
            input.select();
        }
    };

    // =========================
    // CASE 2: 상세 페이지
    // =========================
    const detailBtn = document.querySelector("button#btnAddWordBook");

    if (detailBtn) {

        await handleDetailSave(detailBtn, returnToSearch);
        return;
    }

    // =========================
    // CASE 1: 목록 페이지
    // =========================
    const listAddBtn = document.querySelector(
        "button.unit_add_wordbook._btn_add_wordbook"
    );

    if (listAddBtn) {

        await handleListSave(listAddBtn, returnToSearch);
        return;
    }
}

async function handleDetailSave(detailBtn, returnToSearch) {

    detailBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const wordbook = [...document.querySelectorAll("span.name")]
        .find(e => e.textContent.trim() === "내가 찾은 단어");

    if (!wordbook) return;

    wordbook.click();
    await new Promise(r => setTimeout(r, 300));

    const saveBtn = document.querySelector("a._basic_save");

    if (saveBtn) saveBtn.click();

    await returnToSearch();
}

async function handleListSave(listAddBtn, returnToSearch) {

    listAddBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const wordbook = [...document.querySelectorAll("span.name")]
        .find(e => e.textContent.trim() === "내가 찾은 단어");

    if (!wordbook) return;

    wordbook.click();
    await new Promise(r => setTimeout(r, 300));

    const saveBtn = document.querySelector(
        "a._basic_save._btn_common_default_add"
    );

    if (saveBtn) saveBtn.click();

    await returnToSearch();
}


/*
//리팩토링 전
chrome.runtime.onMessage.addListener(async (message) => {

    //기능 1: txt 추출
    if (message.action == "export") {
            // wbId 추출
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.split("?")[1]);
        const wbId = params.get("wbId");

        if (!wbId) {
            alert("wbId를 찾을 수 없습니다.");
            return;
        }

        let text = "";

        // Anki 헤더
        text += "#separator:tab\n";
        text += "#html:true\n";
        text += "#tags column:3\n";

        let page = 1;
        let totalPages = 1;

        // 모든 페이지 가져오기
        do {

            const api =
                `https://learn.dict.naver.com/gateway-api/jakodict/mywordbook/word/list/search` +
                `?wbId=${wbId}` +
                `&qt=0` +
                `&st=0` +
                `&page=${page}` +
                `&page_size=20` +
                `&domain=naver`;

            const response = await fetch(api, {
                credentials: "include"
            });

            const json = await response.json();

            totalPages = json.data.m_total_pages;

            for (const item of json.data.m_items) {

                const data = JSON.parse(item.content);

                const kana = data.entry.members[0].entry_name;

                const kanji = data.entry.members[0].kanji || kana;

                let meaning = data.entry.means[0].show_mean;

                // HTML 태그 제거
                meaning = meaning.replace(/<[^>]*>/g, "");

                // 양끝 공백 제거
                meaning = meaning.trim();

                text += `${kanji}\t${kana}<br>${meaning}\n`;

            }

            page++;

        } while (page <= totalPages);


        // txt 다운로드
        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "anki.txt";

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        alert("Export complete!");
        return;
    }


    // 기능2. 단어장 자동저장 매크로
    if (message.action === "saveWord") {

        // ==================================================
        // 공통: 검색창 복귀 함수
        // ==================================================
        const returnToSearch = async () => {
            await new Promise(r => setTimeout(r, 300));

            const input = document.querySelector("#ac_input");

            if (input) {
                input.focus();
                input.value = "";
                input.select();
            }
        };


        // ==================================================
        // CASE 2: 상세 페이지
        // ==================================================
        const detailBtn = document.querySelector("button._unit_add_wordbook");

        if (detailBtn) {

            // 2-1 단어장 저장 버튼
            detailBtn.click();

            await new Promise(r => setTimeout(r, 300));

            // 2-2 단어장 선택
            const wordbook = [...document.querySelectorAll("span.name")]
                .find(e => e.textContent.trim() === "내가 찾은 단어");

            if (!wordbook) return;

            wordbook.click();

            await new Promise(r => setTimeout(r, 300));

            // 2-3 기본 저장
            const saveBtn = document.querySelector("a._basic_save");

            if (saveBtn) saveBtn.click();

            await returnToSearch();

            return;
        }

        // ==================================================
        // CASE 1: 목록 페이지
        // ==================================================
        const listAddBtn = document.querySelector(
            "button.unit_add_wordbook._btn_add_wordbook"
        );


        if (listAddBtn) {

            // 1-1 추가 버튼
            listAddBtn.click();

            await new Promise(r => setTimeout(r, 300));

            // 1-2 단어장 선택
            const wordbook = [...document.querySelectorAll("span.name")]
                .find(e => e.textContent.trim() === "내가 찾은 단어");

            if (!wordbook) return;

            wordbook.click();

            await new Promise(r => setTimeout(r, 300));

            // 1-3 저장 버튼
            const saveBtn = document.querySelector(
                "a._basic_save._btn_common_default_add"
            );

            if (saveBtn) saveBtn.click();

            await returnToSearch();

            return;
        }


        
    }
    

});


// // 검색창 포커스 이동

        // await new Promise(r => setTimeout(r, 300));

        // const input = document.querySelector("#ac_input");

        // if (input) {
        //     input.focus();
        //     input.value = "";
        //     input.select();
        // }

        */
