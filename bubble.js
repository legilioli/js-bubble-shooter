function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;


var Colors = (function(){
        var random = function(){
            return Math.floor((Math.random()*256));
        }
        return {
            randomColor:function(){
                var r = random();
                var g = random();
                var b = random();
                return "rgba("+r+","+g+","+b+",0.5)";
            }
        }
})();

var FPSCounter = (function(){
    return {
        current:0,        
        counter:0,
        updateTime:1000,
        elapsed:0,
        oldtime:0,
        getFPS:function(){
            if (this.elapsed > this.updateTime ){
                this.current = this.counter;
                this.counter =0;
                this.elapsed = 0;
            }
            return this.current;
        },
        
        frame:function(){
            var date = new Date();
            this.newtime = date.getTime();
            this.counter = this.counter + 1;
            this.elapsed = this.elapsed + this.newtime - this.oldtime;
            this.oldtime = this.newtime;
        }
    }
})();

 function Grid(rows,cols,bw,bh){
    this.baseY = 0;
    this.rows = rows;
    this.cols = cols;
    this.bw = bw;
    this.bh = bh;
    this.cw = bw * 0.5;
    this.slots = [];
    for (var i = 0; i < rows; i++ ){
        var r = [];
        for ( var j = 0; j < cols; j++)
            r.push(null);
        this.slots.push(r);
    }
 }

Grid.prototype.getCoordForPos = function(i,j){
    return {x:j*this.bw +(i-Math.floor(i/2)*2)*this.bw/2 ,y:i*this.bw};
}

Grid.prototype.getCellIndexForCoord = function(x,y){
    var row = Math.floor(y/this.bw);
    var col = Math.floor((x-this.bw/2*(row - 2*Math.floor(row/2)))/this.bw);
    //if();
    return (row>=0 && col>=0)?{i:row,j:col}:null;
}

Grid.prototype.getBubbleAt = function(i,j){
    return this.slots[i][j];
}

Grid.prototype.hasBubbleUp = function(i,j){
    return ((i-1)>=0&&(this.slots[i-1][j]!=null))?true:false;
}

Grid.prototype.hasBubbleLeft = function(i,j){
    return ((j-1)>=0&&(this.slots[i][j-1]!=null))?true:false;
}

Grid.prototype.hasBubbleRight = function(i,j){
    return ((j+1)<this.cols&&(this.slots[i][j+1]!=null))?true:false;
}


Grid.prototype.isCellAttachable = function(i,j){
    var row = i;
    var col = j;
    if(row>=0 && col>=0){
        var posClear = (this.getBubbleAt(i,j) == null);
        var upPos = ((i-1)>=0)?(this.hasBubbleUp(i,j)):true;
        var leftPos = false;//this.hasBubbleLeft(i,j);
        var rightPos = false;//this.hasBubbleRight(i,j);
        var evenRow = ((i-Math.floor(i/2)*2)==0)?true:false;
        var upRightLeftPos = false;
        if (!evenRow)//chequeo por up right
            upRightLeftPos = ((j+1)<this.cols)?this.hasBubbleUp(i,j+1):false;
        else
            //chequeo por up left
            upRightLeftPos = ((j-1)>=0)?this.hasBubbleUp(i,j-1):false;
        return (posClear && (leftPos | rightPos | upPos | upRightLeftPos));
    }
    return false;
}



Grid.prototype.addBubble = function(bubble,i,j){
    if(i<=this.rows && j<= this.cols){
        var wpos = this.getCoordForPos(i,j);
        bubble.p.x = wpos.x+this.bw/2;
        bubble.p.y = wpos.y+this.bh/2;
        bubble.setActive(false);
        this.slots[i][j] = bubble;
    }
};

Grid.prototype.removeBubble = function(i,j){
        this.slots[i][j] = null;
};


 function Bubble(x,y,r){
        this.color = Colors.randomColor();
        this.p = {x:x,y:y};
        this.v = {x:0,y:0};
        this.g = {x:0,y:0};
        this.r = r;
        this.active = true;
        this.popped = false;
    }

    Bubble.prototype.step = function(dt){
        if(this.active){
            this.v.x = this.v.x + this.g.x*dt;
            this.v.y = this.v.y + this.g.y*dt;
            this.p.x = this.v.x*dt + this.p.x;
            this.p.y = this.v.y*dt + this.p.y;
        }
    }

    Bubble.prototype.setP = function(x,y){
        this.p.x = x;
        this.p.y = y;
    };

    Bubble.prototype.setV = function(x,y){
        this.v.x = x;
        this.v.y = y;
    };

    Bubble.prototype.incVx = function(inc){
        this.v.x += inc;
    };

    Bubble.prototype.incVy = function(inc){
        this.v.y += inc;
    };

    Bubble.prototype.setR = function(radius){
        this.r = radius;
    }

    Bubble.prototype.setActive = function(active){
        this.active = active;
    }

    Bubble.prototype.stop = function(){
        this.p.y = this.p.x = 0;
    }

    Bubble.prototype.pop = function(){
        this.g = {x:0,y:0.001};
        this.v.y = -0.2-Math.random()*0.1;
        this.v.x = Math.random()*0.2-0.1;
        this.setActive(true);
        this.popped = true;
    }

    var Renderer = (function(){

        var drawBoard = function(dc,x,y,w,h){
            dc.fillStyle = "rgb(20,20,20)";        
            dc.fillRect(0,0,w,h);
        }

        return {
        
            drawText:function(text,x,y){
                dc.font = "12px sans-serif";
                dc.fillStyle = "rgb(0,0,0)";      
                dc.fillText(text,x,y);
            },
        
            drawBubble:function(bubble,dc){
                dc.beginPath();
                dc.fillStyle = bubble.color;
                dc.lineWidth = 1.5;
                dc.arc(0,0,bubble.r,0,360,false);
                dc.fill();
                dc.strokeStyle = "#000000";
                dc.stroke();
                dc.closePath();
                dc.lineWidth = 1.0;
//                dc.strokeStyle = "#00FF00";
//                dc.strokeRect(-bubble.r,-bubble.r,bubble.r*2,bubble.r*2);
                dc.strokeStyle = "#FF0000";
                dc.strokeRect(0,0,1,1);

            },

            drawBubbleXY:function(bubble,dc,x,y){
                dc.save();
                dc.translate(x,y);
                Renderer.drawBubble(bubble,dc);
                dc.restore();
            },
            
            drawBoard:function(dc,x,y,w,h){
                dc.fillStyle = "rgb(200,200,200)";        
                dc.fillRect(0,0,w,h);
                dc.strokeStyle = "rgb(0,0,0)";
                dc.strokeRect(0,0,w,h);
            },
            

            drawWorld:function(world,dc){
                Renderer.drawBoard(dc,world.x,world.y,world.w,world.h);
                for (var i=0; i<world.bubbles.length;i++){
                    var b = world.bubbles[i];
                    Renderer.drawBubbleXY(b,dc,b.p.x,b.p.y);
                }
                
                dc.strokeStyle = "#555555";
                for(var i=0; i<world.bubblegrid.slots.length;i++)
                    for(var j=0; j<world.bubblegrid.slots[0].length;j++){
                        var pos = world.bubblegrid.getCoordForPos(i,j);
                        dc.strokeRect(pos.x,pos.y,world.bw,world.bh);                        
                    }
                
                Renderer.drawText("FPS: " + FPSCounter.getFPS(),10,370);
                Renderer.drawText("Bubbles: " + world.bubbles.length,10,382);
            }
        }

    })();


    function World(w,h){
        this.w=w;
        this.h=h;
        this.g=-1;
        this.bubblegrid = new Grid(Math.floor(this.h/this.bw),Math.floor(this.w/this.bw),this.bw,this.bh);
        this.bubbles = [];
        this.deadBubbles = [];
        this.firedBubbles = [];
    }
    
    World.prototype.bw = 25;
    World.prototype.bh = 25;
    
    World.prototype.setup = function(){
        var bubblesRows = 5;
        var bubblesCols = Math.floor(this.w/this.bw);
        for (var j = 0; j<bubblesRows; j++)
            for (var i = 0; i<bubblesCols-(j - Math.floor(j/2)*2); i++){
                var b = new Bubble( this.bw/2*(j - Math.floor(j/2)*2) + i*this.bw+this.bw/2,j*this.bh+this.bh/2,this.bw/2);
                b.setActive(false);
                b.v.y = i*0.01;
                b.g = {x:0,y:0.0001};
                this.bubblegrid.addBubble(b,j,i);
                this.addBubble(b);
            }
    }

    World.prototype.addBubble = function(b){
        this.bubbles.push(b);
        console.log("adding bubble " + this.bubbles.length );
        
    }

    World.prototype.log = function(){
        console.log("Tengo "+this.bubbles.length + " bubbles");
    }

    World.prototype.step = function(dt){
        //update de posicion de las burbujas
        for(var i = 0; i<this.bubbles.length; i++){
            var b = this.bubbles[i];
            b.step(dt);
            //chequeo por rebotes en paredes
            if((b.p.x + b.v.x) <= this.bw/2 || (b.p.x + b.v.x) >= (this.w-this.bw/2))
                b.v.x *=-1;
            //chequeo por salidas del area de pantalla
            if(b.p.x > this.w || b.p.y > this.h || b.p.y < 0)
                    this.deadBubbles.push(i);
        }
        
        //si es un disparo verifico fijacion
        for(var i = 0; i<this.firedBubbles.length;i++){
              var b = this.firedBubbles[i];
              if(b.p.y < 0) {
                this.firedBubbles.splice(0,1);
              } else {
                  var pos = this.bubblegrid.getCellIndexForCoord(b.p.x,b.p.y);
                  if(pos)
                      if(w.bubblegrid.isCellAttachable(pos.i,pos.j)){
                        console.log("attach");
                        this.bubblegrid.addBubble(b,pos.i,pos.j);                        
                        this.firedBubbles.pop();
                      };
              }
        }
        
        //quito las que no estan mas en pantallas;
        for (var j = 0; j< this.deadBubbles.length;j++)
            this.bubbles.splice(this.deadBubbles[j],1);        
        this.deadBubbles.splice(0,this.deadBubbles.length);                
    }
    
    World.prototype.fireBubble = function(target){
        if(this.firedBubbles.length==0){
            var dir = {x:target.x-w.w/2,y:target.y-this.h+1};
            var b = new Bubble(this.w/2,this.h+1,this.bw/2);
            var norma = Math.sqrt(dir.x*dir.x+dir.y*dir.y);
            b.v.x = dir.x/norma *0.3;
            b.v.y = dir.y/norma * 0.3;
            this.addBubble(b);
            this.firedBubbles.push(b);
        }
    }


var init = function(){

   
    window.requestAnimationFrame = (function (){
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                function(callback){
                    window.setTimeout(callback,1000/60);
                }
    })();

    function screen2World(pos){
        return {x:pos.x-75,y:pos.y};
    }


    var c = document.getElementById("c");
    
    c.onclick = function(evt){
        mousepos = c.relMouseCoords(evt);
        mouseclick = true;
        console.log("click: " + mousepos.x + "," + mousepos.y);
    }
    
    dc = c.getContext("2d");
    w = new World(250,400);
    //w.setup();
    
    var mouseclick = false;
    var mousepos = null;
    
    var button = document.getElementById("button_new");
    button.onclick = function(){
       // w.addBubble(new Bubble(20,20,30));
    }

        

    function gameLoop(oldtime){
        var date = new Date();
        var now = date.getTime();
        var dt = date.getTime() - oldtime ;        
        
        //process input
        if(mouseclick){
            var wpos = screen2World(mousepos);
            w.fireBubble(wpos);
            var p = w.bubblegrid.getCellIndexForCoord(wpos.x,wpos.y,w);
            //console.log(p);
            //console.log("pos: "+p.i+","+p.j);
            if (p){
            var b = w.bubblegrid.getBubbleAt(p.i,p.j);
                if(b) {
                    console.log("popping");
                    b.pop();
                    w.bubblegrid.removeBubble(p.i,p.j);
                }   
            }
            mouseclick = false;
        }

        //stepgame
        w.step(dt);

        // draw
        FPSCounter.frame();
        dc.fillStyle="#FFFFFF";
        dc.fillRect(0,0,c.width,c.height);
        dc.save();
        dc.translate(75,0);
        Renderer.drawWorld(w,dc);
        dc.restore();
        requestAnimationFrame(function(){gameLoop(now)});
    }

    var date = new Date();
    gameLoop(date.getTime());

}

window.onload = init;
