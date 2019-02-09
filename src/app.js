const Koa = require("koa");
const Router = require("koa-router");
const { PassThrough } = require("stream");
const cors = require('@koa/cors');
const serve = require('koa-static');

const app = new Koa();
app.use(cors());
app.use(serve('.'));

const router = new Router();

const PORT = 3000;

const computers = [

];

const IMAGES = {
    "delta": "https://cdn.discordapp.com/attachments/343076544287080456/373179038300372994/SVG_DELTA_fin.svg"
}

router.get("/:floor/:place/:row", async ctx => {
    const { floor, place, row } = ctx.params;
    const { height, width } = ctx.query;

    const stream = new PassThrough();
    const send = (event, data) => {
      stream.write(`event:${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    ctx.req.once("close", () => ctx.res.end());
    ctx.req.once("finish", () => ctx.res.end());
    ctx.req.once("error", () => ctx.res.end());
    ctx.type = "text/event-stream";
    ctx.body = stream;

    for (const [id, url] of Object.entries(IMAGES)) {
        send("image", { id, url })
    }

    console.log(`e${floor}p${place}r${row} connected with ${height} ${width}`)

    const obj = {
        floor,
        place,
        row,
        height,
        width,
        send
    }

    computers.push(obj)

    stream.on("close", () => computers.splice(computers.indexOf(obj), 1))
});

const IMAGE_WIDTH = 841 / 2
const IMAGE_HEIGHT = 977 / 2

router.get("/start", async ctx => {
    let x = 0;

    while (true) {
        let offset = 0;
        const totalWidth = computers.reduce((c, { width }) => c + +width, 0);
        function doRun({ height, width, send, row })
        {
            if (x > offset - IMAGE_WIDTH && x < offset + width + IMAGE_WIDTH)
                send("display", {
                    x: x - offset,
                    y: height / 2 - IMAGE_HEIGHT / 2,
                    type: "image",
                    data: "delta",
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT
                });
            offset += +width;
        }
        for (const computer of computers)
        {
            computer.send("clear")
            doRun(computer)
        }
        console.log(offset)
        doRun(computers[0])
        console.log(offset)
        x += 5;
        x %= totalWidth;
        await new Promise(r => setTimeout(r, 5))
    }


    /*while (true) {
        computers[c].send("display", {
            x: i,
            y: computers[c].height / 2 - IMAGE_HEIGHT / 2,
            type: "image",
            data: "delta",
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT
        });
        i += 2;
        if (i > computers[c].width)
        {
            i = -IMAGE_WIDTH;
            computers[c].send("clear")
            c++;
            if (c >= computers.length)
                c = 0
        }
        await new Promise(r => setTimeout(r, 5))
    }*/
})

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => console.log(`App listening on ${PORT}`));