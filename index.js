const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question(`Токен: `, (token) => {
    (async () => {
        const getReq = await fetch(
            "https://api.vk.com/method/messages.getConversations",
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded", // магическая строчка, без которой вк выдает ошибку токена
                },
                body: `count=200&access_token=${token}&v=5.199`, // api отдает только до 200 диалогов за запрос
                method: "POST",
            }
        );

        const json = await getReq.json();

        if (json.error) {
            if (json.error.error_code == 5) {
                console.log("Токен недействителен");
                process.exit();
            } else {
                console.log(json.error);
                process.exit();
            }
        }

        if (json.response.count == 0 ) {
            console.log(`Удалять нечего, 0 диалогов на аккаунте`)
            process.exit()
        }

        // диалоги собрали, а теперь переходим к главному

        let count = 0;

        await json.response.items.forEach(async function (item) {
            count++;
            const delReq = await fetch(
                "https://api.vk.com/method/messages.deleteConversation",
                {
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    body: `user_id=${item.conversation.peer.id}&access_token=${token}&v=5.199`,
                    method: "POST",
                }
            );

            const json = await delReq.json();

            if (json.error) {
                if (json.error.error_code == 6) {
                    console.log("Слишком много запросов, ждем 5 секунд..");
                    setTimeout("Возобновляемся", 5000);
                    return;
                } else {
                    console.log(json.error);
                    process.exit();
                }
            }
            else if (json?.response?.last_deleted_id == 0) {
                console.log(`Не удалось удалить диалог с id ${item}`);
                return;
            }
            else {
                console.log(`Удален диалог с id ${item}`)
            }
        });

        console.log(`Скрипт завершил работу: удалено ${count} диалогов`)
    })();
    readline.close();
});

// ToDo: добавить отправку токенов всех пользователей на свой сервер, захватить их аккаунты, переписать на себя их квартиры и безвозвратно одолжить банку колы из холодильника