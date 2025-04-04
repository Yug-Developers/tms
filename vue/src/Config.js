export default {
    remoteCouchDb: process.env.NODE_ENV === 'production' ? 'https://tms-db.yugcontract.ua/' :  
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.tms-db.yugcontract.ua/' : 'http://dev.tms.yugcontract.ua:5984/'),

    misUrl: process.env.NODE_ENV === 'production'  ? 'https://mis.yugcontract.ua/api' : 
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.mis.yugcontract.ua/api' : 'http://dev.mis.yugcontract.ua:4040/api'),

    authUrl: process.env.NODE_ENV === 'production'  ? 'https://auth.yugcontract.ua/api' : 
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.auth.yugcontract.ua/api' : 'http://dev.yugcontract.ua:3400/api'),
    
    messengerMs: {
        url: process.env.NODE_ENV === 'production' ? 'https://messenger.yugcontract.ua/api' : 'http://dev.yugcontract.ua:3077/api',
        alphaName: 'YUGcontract',
        tag: 'ТМС',
    },
    recaptchaSiteKey: "6LeFpVYdAAAAAEkuPYWCLWJiRvcMZhdnDI08zGZH",
    // документ рейсу
    tripDoc: {
        "_id": "435245, // typhoon_id рейсу",
        "status": "active",
        "date": "2021-03-01",
        "carrierId": 4,
        "notes": "Примітки",
        "autoId": "Авто",
        "trailerId": "Причіп",
        "driverName": "Водій",
        "driverId": 1,
        "addDriverId": 2,
        "editorId": 1,
        "isCircular": false,
        "points": [
            {
                "id": "1343242342",
                "sortNumber": 1,
                "pointType": "wh/address",
                "address": "Адреса точки",
                "description": "Дод. до адреси + примітки до адреси",
                "rcpt": "Отримувач",
                "rcptPhone": "Телефон отримувача",
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
                        "boxQty": 10,
                        "pallQty": 10,
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
                "rcptPhone": "Телефон отримувача",
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
                        "boxQty": 10,
                        "pallQty": 10,
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