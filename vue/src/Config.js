export default {
    remoteCouchDb: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev_production' ?
        'https://dev.tms-db.yugcontract.ua/' : 'http://dev.tms.yugcontract.ua:5984/',
    remoteCouchDbAuth: {
        username: 'tms',
        password: 'koputraPo5'
    },
    misUrl: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev_production' ? 'https://mis.yugcontract.ua/api' : 'http://dev.mis.yugcontract.ua:4040/api',
    jwt: {
        secret: 'jlkjasd23032mlm342kjklj241lkjlkjlj243',
        expire: 300 * 60
    },
    messengerMs: {
        url: process.env.NODE_ENV === 'production' ? 'https://messenger.yugcontract.ua/api' : 'http://dev.yugcontract.ua:3077/api',
        alphaName: 'YUGcontract',
        tag: 'ТМС',
    },
    // документ рейсу
    tripDoc: {
        "_id": "435245, // typhoon_id рейсу",
        "status": "active",
        "date": "2021-03-01",
        "carrier": 4,
        "description": "Примітки",
        "auto": "Авто",
        "trailer": "Причіп",
        "driver": "Водій",
        "driverCode": 1,
        "addDriverCode": 2,
        "editor": 1,
        "circleType": false,
        "points": [
            {
                "id": "1343242342",
                "sort": 1,
                "pointType": "wh/address",
                "address": "Адреса точки",
                "description": "Дод. до адреси + примітки до адреси",
                "rcpt": "Отримувач",
                "rcptTel": "Телефон отримувача",
                "distance": 10,
                "coordinates": {
                    "latitude": 49.123456,
                    "longitude": 30.123456
                },
                "docs": [
                    {
                        "id": "doc_typhoon_1",
                        "taxNumber": "1234567890",
                        "docType": "out/in/task",
                        "description": "Примітки до документу",
                        "weight": 1000,
                        "volume": 10,
                        "boxes": 10,
                        "pallets": 10,
                        "sum": 1000,
                        "tasks": [
                            {
                                "id": 1,
                                "name": "Завдання"
                            }
                        ]
                    }
                ]
            },
            {
                "id": "2 ? sort ?",
                "pointType": "wh/address",
                "name": "Адреса точки",
                "description": "Дод. до адреси + примітки до адреси",
                "rcpt": "Отримувач",
                "rcptTel": "Телефон отримувача",
                "distance": 100,
                "coordinates": {
                    "latitude": 49.123456,
                    "longitude": 30.123456
                },
                "docs": [
                    {
                        "id": "doc_typhoon_2",
                        "taxNumber": "1234567890",
                        "docType": "out/in/task",
                        "description": "Примітки до документу",
                        "weight": 1000,
                        "volume": 10,
                        "boxes": 10,
                        "pallets": 10,
                        "sum": 1000,
                        "tasks": [
                            {
                                "id": 1,
                                "name": "Завдання"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    // документ статусу маршруту
    tripStatusDoc: {
        _id: 435245, // typhoon_id рейсу
        status: 200,
        startTime: "2021-03-01T08:00:00",
        finishTime: '2021-03-01T08:00:00',
        odometerStart: 1000,
        odometerFinish: 2000,
        points: [
            {
                id: '1',
                status: 100,
                arrivalTime: '2021-03-01T08:00:00',
                departureTime: '2021-03-01T08:00:00',
                coordinates: {
                    latitude: 49.123456,
                    longitude: 30.123456
                },
                docs: [
                    {
                        id: "doc_typhoon_1",
                        status: 100,
                        description: "Примітки до статусу документу",
                        statusConnection: true,
                        sumFact: 1000,
                        sumPack: 1000,
                        tasks: [
                            {
                                id: 1,
                                status: 100
                            }
                        ]
                    }
                ]
            }
        ]
    },
}