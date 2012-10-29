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

shuffle = function(o){ //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};


//Returns true if the circles are touching, or false if they are not
function circlesColliding(x1, y1, radius1, x2, y2, radius2){
    //compare the distance to combined radii
    var dx = x2 - x1;
    var dy = y2 - y1;
    var radii = radius1 + radius2;
    if ( ( dx * dx )  + ( dy * dy ) < radii * radii )
        return true;
    else
        return false;
}

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
    this.marked = [];
    for (var i = 0; i < rows; i++ ){
        var r = [];
        for ( var j = 0; j < (cols - (i - Math.floor(i/2)*2)); j++)
            r.push(null);
        this.slots.push(r);
    }
    this.state = this.states.STILL;
    this.nextY = 0;
    this.shakeRot = 0;
    this.bubblePopUpCallback = null;
}

Grid.prototype.getBubblesValues = function(f){
    var colors = [];
    for(var i=0; i<this.slots.length;i++)
        for (var j=0; j<this.slots[0].length;j++)
            if (this.slots[i][j])
                if(colors.indexOf(this.slots[i][j].value)<0)
                    colors.push(this.slots[i][j].value);
            
    return colors;
}

Grid.prototype.setBubblePopUpCallback = function(f){
    this.bubblePopUpCallback = f;
}

Grid.prototype.setBubbleFallCallback = function(f){
    this.bubbleFallCallback = f;
}

Grid.prototype.states = {
    STILL:0,
    MOVING_DOWN:1,
    SHAKING:2,
};

Grid.prototype.getUpLeftPos = function(i,j){
    return {i:i-1,j:(this.isRowEven(i))?j-1:j};
}

Grid.prototype.getUpRightPos = function(i,j){
    return {i:i-1,j:(this.isRowEven(i))?j:j+1};
}

Grid.prototype.getCoordForPos = function(i,j){
    return {x:j*this.bw +(i-Math.floor(i/2)*2)*this.bw/2 ,y:i*this.bw + this.baseY};
}

Grid.prototype.getCellIndexForCoord = function(x,y){
    var row = Math.floor((y-this.baseY)/this.bw);
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

Grid.prototype.getBubbleLeft=function(i,j){
    return (this.hasBubbleLeft(i,j))?this.slots[i][j-1]:null;
}

Grid.prototype.getBubbleRight=function(i,j){
    return (this.hasBubbleRight(i,j))?this.slots[i][j+1]:null;
}

Grid.prototype.isRowEven = function(i){
    return ((i-Math.floor(i/2)*2)==0)?true:false;
}

Grid.prototype.hasBubbleUpRight=function(i,j){
    if((i-1)<0 || (i>this.slots.length)) return false;
    var evenrow = this.isRowEven(i);
    var jj = (evenrow)?j:j+1;
    return (jj<(this.slots[i-1].length))?(this.slots[i-1][jj]!=null):false;
}

Grid.prototype.getBubbleUpRight=function(i,j){
    if (this.hasBubbleUpRight(i,j))
        return this.slots[i-1][(this.isRowEven(i))?j:j+1];
    return null;
}

Grid.prototype.hasBubbleUpLeft=function(i,j){
    if((i-1)<0 || (i>this.slots.length)) return false;
    var evenrow = this.isRowEven(i);
    var jj = (evenrow)?j-1:j;
    return (jj>=0 && jj<this.slots[i-1].length)?(this.slots[i-1][jj]!=null):false;
}

Grid.prototype.getBubbleUpLeft=function(i,j){
    if (this.hasBubbleUpLeft(i,j))
        return this.slots[i-1][(this.isRowEven(i))?j-1:j];
    return null;
}

Grid.prototype.hasBubbleDownLeft = function(i,j){
    if((i<0)||(i>this.slots.length)) return false;
    var evenrow = this.isRowEven(i,j);
    var jj = (evenrow)?j-1:j;
    return (jj>=0 && jj<this.slots[i+1].length)?(this.slots[i+1][jj]!=null):false;
}

Grid.prototype.getBubbleDownLeft = function(i,j){
    if (this.hasBubbleDownLeft(i,j))
        return this.slots[i+1][(this.isRowEven(i))?j-1:j];
    return null;
}

Grid.prototype.hasBubbleDownRight=function(i,j){
    if((i<0)||(i>this.slots.length)) return false;
    var evenrow = this.isRowEven(i,j);
    var jj = (evenrow)?j:j+1;
    return (jj<(this.slots[i+1].length))?(this.slots[i+1][jj]!=null):false;
}

Grid.prototype.getBubbleDownRight=function(i,j){
    if (this.hasBubbleDownRight(i,j))
        return this.slots[i+1][(this.isRowEven(i))?j:j+1];
    return null;
}


Grid.prototype.addBubble = function(bubble,i,j){
    if(i<=this.rows && j<= this.cols){
        //console.log("posicion luego de step: " + bubble.p.x + ", " + bubble.p.y);
        if(this.slots[i][j]== null)
            this.slots[i][j] = bubble;
        else throw {error:"El slot no estava vacio",oldBubble:this.slots[i][j],newBubble:bubble};
        var wpos = this.getCoordForPos(i,j);
        bubble.p.x = wpos.x+this.bw/2;
        bubble.p.y = wpos.y+this.bh/2;
        bubble.setActive(false);
    }
};

Grid.prototype.removeBubble = function(i,j){
        this.slots[i][j] = null;
};

Grid.prototype.getAdjacentBubbles = function(i,j){
    var bubbles = [];
    if (this.hasBubbleLeft(i,j)) bubbles.push(this.getBubbleLeft(i,j));
    if (this.hasBubbleRight(i,j)) bubbles.push(this.getBubbleRight(i,j));
    if (this.hasBubbleUpRight(i,j)) bubbles.push(this.getBubbleUpRight(i,j));
    if (this.hasBubbleUpLeft(i,j)) bubbles.push(this.getBubbleUpLeft(i,j));
    if (this.hasBubbleDownLeft(i,j)) bubbles.push(this.getBubbleDownLeft(i,j));
    if (this.hasBubbleDownRight(i,j)) bubbles.push(this.getBubbleDownRight(i,j));
    return bubbles;
};

Grid.prototype.markBubble2 = function(i,j){
    this.slots[i][j].setOrphan(false);
    var adj = this.getAdjacentBubbles(i,j);
    for(var i=0; i<adj.length;i++)
        if(adj[i].orphan){
            var pos = this.getCellIndexForCoord(adj[i].p.x,adj[i].p.y);   
            this.markBubble2(pos.i,pos.j);
        }
};





Grid.prototype.markBubble = function(i,j,value){
    this.slots[i][j].setMarked(true);
    this.marked.push({i:i,j:j});
    var adj = this.getAdjacentBubbles(i,j);

    for(var i=0; i<adj.length;i++)
        if((adj[i].mark==false) && (adj[i].value == value)){
//          console.log("marcar!");
            var pos = this.getCellIndexForCoord(adj[i].p.x,adj[i].p.y);   
            this.markBubble(pos.i,pos.j,value);
        }
};

Grid.prototype.popMarkedBubbles = function(){
    console.log("popping " +  this.marked.length + " bubbles");
    if(this.marked.length>2)
        for(var i = 0; i<this.marked.length;i++){
            var p = this.marked[i];
            var b = this.getBubbleAt(p.i,p.j);
            this.bubblePopUpCallback(b);
            b.pop();
            this.removeBubble(p.i,p.j)
        }
}

Grid.prototype.clearMarkedBubbles = function(){
    for(var i = 0; i<this.marked.length;i++){
        var p = this.marked[i];
        var b = this.getBubbleAt(p.i,p.j);
        if(b) b.setMarked(false);
    }
    this.marked.length = 0;
}

Grid.prototype.markAll = function(){
    for(var i = 0; i<this.slots.length; i++)
        for (var j = 0; j<this.slots[i].length;j++){
            if(this.slots[i][j]!=null){
                this.slots[i][j].setMarked(true);
                this.marked.push({i:i,j:j});
            }
        }
}

Grid.prototype.isBubbleOrphan = function(i,j){
    if(i==0) return false;
    var upright = this.getBubbleUpRight(i,j); 
    var upleft = this.getBubbleUpLeft(i,j); 
    var hasupright = this.hasBubbleUpRight(i,j);
    var hasupleft = this.hasBubbleUpLeft(i,j);
    var uL = this.getUpLeftPos(i,j);
    var uR = this.getUpRightPos(i,j);
    if( hasupright && hasupleft)
        return (this.isBubbleOrphan(uR.i,uR.j)&&this.isBubbleOrphan(uL.i,uL.j));
    if(this.hasBubbleUpRight(i,j))
        return this.isBubbleOrphan(uR.i,uR.j);
    if(this.hasBubbleUpLeft(i,j))
        return this.isBubbleOrphan(uL.i,uL.j);
    return true;
}

Grid.prototype.detachOrphanBubbles = function(){

    for(var i = 0; i < this.slots.length;i++)
        for(var j = 0; j < this.slots[i].length;j++)
            if (this.slots[i][j])
                this.slots[i][j].setOrphan(true);        
        
    for (var i = 0; i < this.slots[0].length; i++)
        if (this.slots[0][i])
            this.markBubble2(0,i);        

    for(var i = 0; i<this.slots.length; i++)
        for (var j = 0; j<this.slots[i].length;j++){
            var b = this.slots[i][j];
            if(b && this.slots[i][j].orphan){
                this.removeBubble(i,j);
                b.fall();
                this.bubbleFallCallback(b);
            }
        }
}

Grid.prototype.shake = function(doShake){
    this.state = (doShake)?this.states.SHAKING:this.states.STILL;
}

Grid.prototype.lowerGrid = function(){
    this.state = this.states.MOVING_DOWN;
    this.nextY = this.baseY + this.bh;

}

Grid.prototype.step = function(dt){
    switch (this.state){
        case this.states.MOVING_DOWN:
            var stepSize = this.bh/250
            this.baseY += stepSize*dt;
            for (var i = 0; i<this.slots.length;i++)
                for (var j = 0; j < this.slots[i].length;j++)
                    if(this.slots[i][j]!=null)
                    this.slots[i][j].p.y += stepSize*dt;
            if (this.baseY >= this.nextY)
                this.state = this.states.STILL;
        break;
        case this.states.SHAKING:
            var rotstep = Math.PI*15;
            this.shakeRot += rotstep*dt/1000;
            if (this.shakeRot > Math.PI*2)
                this.shakeRot -= Math.PI*2;
        default:
    }
}

function Bubble(x,y,r){
    this.color = Colors.randomColor();      
    this.p = {x:x,y:y};
    this.v = {x:0,y:0};
    this.g = {x:0,y:0};
    this.r = r;
    this.active = true;
    this.popped = false;
    this.mark = false;
    this.orphan = false;
    this.value = shuffle([0,1,2,3,4])[0];
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

Bubble.prototype.setOrphan = function(orphan){
    this.orphan = orphan;
}

Bubble.prototype.setMarked = function(marked){
    this.mark = marked;
}

Bubble.prototype.isPopped = function(){
    return this.popped;
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

Bubble.prototype.fall = function(){
    this.g = {x:0,y:(0.0005)};
    this.v.x=0; this.v.y=0.02*this.p.y/this.r;
    this.setActive(true);
    this.popped = true;
}



function TextSprite(x,y,vx,vy,text) {
    this.time = 0;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.text = text;
    this.active = true;
}

TextSprite.prototype.delay = 1000;

TextSprite.prototype.step = function(dt){
console.log("steppint");
    if(this.active){
        this.time += dt;
        this.x += this.vx*dt;
        this.y += this.vy*dt;
        if (this.time > this.delay)
            this.active = false;
    }
}

function EntityGroup(){
    this.entities = [];
}

EntityGroup.prototype.step = function(dt){
    for (var i=0; i<this.entities.length;i++)
        this.entities[i].step(dt);
}

EntityGroup.prototype.addEntity = function(entity){
    this.entities.push(entity);
}


function PointsTextManager(){
    this.texts = [];
    this.addTextSprite = function(sprite){
        this.texts.push(sprite);
    };
    this.clearInactive = function(){
        this.texts = this.texts.filter(function(v){return (v.active)});    
    };
    this.step = function(dt){

        for(var i = 0; i< this.texts.length;i++)
            this.texts[i].step(dt);
        this.clearInactive();
    };
}


//function TextManager(){
//    this.textGroups = [];
//    this.textGroupIds = [];
//}

//TextManager.prototype.addTextGroup = function(id) {
//    this.textGroupsIds.push(id);
//}

//TextManager.prototype.addText = function(groupid,text){
//    var idx = -1;
//    for (var i=0; i < this.textGroupIds.length;i++)
//        if (this.textGroups[i] == groupid)
//            idx = -1; break;
//    if (idx >= 0){
//        this.textGroups[idx].push(text);
//    }
//}

var Renderer = (function(){

    var drawBoard = function(dc,x,y,w,h){
        dc.fillStyle = "rgb(20,20,250)";        
        dc.fillRect(0,0,w,h);
    }

    var color = ["rgba(255,0,0,0.5)","green","blue","yellow","white"];
    var bw = 25;
    var bh = 25;
    var greenBubble = document.createElement('canvas');
    var redBubble = document.createElement('canvas');
    var bubblesRenders = []; 
    

    var drawBubble = function(bubble,dc){
        dc.beginPath();
        dc.fillStyle = color[bubble.value];//bubble.color;
        dc.lineWidth = 1.5;
        dc.arc(0,0,bubble.r*0.95,0,360,false);
        dc.fill();
        dc.strokeStyle = "#000000";
        dc.stroke();
        dc.closePath();
        dc.lineWidth = 1.0;
        if(bubble.mark){
            dc.strokeStyle = "#00FF00";
            dc.strokeRect(-bubble.r,-bubble.r,bubble.r*2,bubble.r*2);
        }
        dc.strokeStyle = "#FF0000";
        dc.strokeRect(0,0,1,1);
    };

    //prerender de bolas
    modelBubble = new Bubble(0,0,bw/2);
    
    
    for (var i = 0; i< color.length; i++){
        var c = document.createElement('canvas');
        c.widht = bw;
        c.height = bh;
        dc = c.getContext("2d");
        modelBubble.value = i;
        dc.save();
        dc.translate(modelBubble.r,modelBubble.r);
        drawBubble(modelBubble,dc);
        dc.restore();
        bubblesRenders.push(c);
    }
    
    
    return {

        setTextFont:function(font,color){
            dc.font = font;
            dc.fillStyle = color;             
        },
        
        drawText:function(text,x,y){
            dc.fillText(text,x,y);
        },

        drawBubbleXY:function(bubble,dc,x,y){
            dc.save();
            dc.translate(x-bw/2,y-bh/2);
            dc.drawImage(bubblesRenders[bubble.value],0,0);
            dc.restore();
        },
        
        drawBoard:function(dc,x,y,w,h){
            dc.fillStyle = "rgb(100,100,100)";        
            dc.fillRect(0,0,w,h);
            dc.strokeStyle = "rgb(0,0,0)";
            dc.strokeRect(0,0,w,h);
        },
        
        drawWorld:function(world,dc){
        
            //Dibujo el tablero
            Renderer.drawBoard(dc,world.x,world.y,world.w,world.h);
            
            //Dibujo las lineas de la grilla de burbujas
            dc.strokeStyle = "#555555";
            for(var i=0; i<world.bubblegrid.slots.length;i++)
                for(var j=0; j<world.bubblegrid.slots[i].length;j++){
                    var pos = world.bubblegrid.getCoordForPos(i,j);
                    dc.strokeRect(pos.x,pos.y,world.bw,world.bh);                        
                }
                
            //Dibujo las burbujas de la grilla
            var dx = (world.bubblegrid.state == Grid.prototype.states.SHAKING)?Math.sin(world.bubblegrid.shakeRot)*world.bw/6:0;
            dc.save();
            dc.translate(dx,0);
            for (var i=0; i< world.bubblegrid.slots.length; i++)
                for (var j=0; j<world.bubblegrid.slots[0].length;j++)
                    if (world.bubblegrid.slots[i][j] != null){
                        var b = world.bubblegrid.slots[i][j];
                        Renderer.drawBubbleXY(b,dc,b.p.x,b.p.y);
                    }
            dc.restore();
            
            //Dibujo burbujas libres
            for (var i=0; i< world.bubbles.length;i++){
                b = world.bubbles[i];
                Renderer.drawBubbleXY(b,dc,b.p.x,b.p.y);
            }
            
            //Dibujo la burbuja que se esta disparando
            var b = world.firedBubbles[0];
            if (b) Renderer.drawBubbleXY(b,dc,b.p.x,b.p.y);
            
            //Dibujo la proxima burbuja a ser disparada
            var b = world.nextBubble;                
            Renderer.drawBubbleXY(b,dc,b.p.x,b.p.y);
            
            //Dibujo textos con puntajes y demás info
            Renderer.setTextFont("12px sans-serif","rgb(0,0,0)");
            Renderer.drawText("FPS: " + FPSCounter.getFPS(),10,360);
            Renderer.drawText("Bubbles: " + world.bubbles.length,10,372);
            Renderer.drawText("Firing: " + (world.firedBubbles.length>0),10,384);
            Renderer.drawText("Points: " + world.points,10,396);
    
            //Dibujo textos flotantes de los puntajes
            Renderer.setTextFont("15px italic arial,sans-serif strong","rgb(0,0,0)");
            for (var i = 0; i< world.pointTexts.texts.length;i++)
                Renderer.drawText(world.pointTexts.texts[i].text,world.pointTexts.texts[i].x,world.pointTexts.texts[i].y);

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
    this.shots=0;
    this.shotLimit=6;
    this.points = 0;
    this.pointTexts = new PointsTextManager();
    var world = this;
    this.bubblegrid.setBubblePopUpCallback(function(b){
        world.bubbles.push(b);
        console.log("adding text");
        world.pointTexts.addTextSprite(new TextSprite(b.p.x,b.p.y,0.02,-0.04,"10"));
        console.log(world.pointTexts);
        world.points += 10;
        });
    this.bubblegrid.setBubbleFallCallback(function(b){
        world.bubbles.push(b);
    });
}

World.prototype.bw = 25;
World.prototype.bh = 25;

World.prototype.createNextBubble = function(){
    var b = new Bubble(this.w/2,this.h-this.bw/2,this.bw/2);
    var values = this.bubblegrid.getBubblesValues();
    var index = Math.floor(Math.random()*values.length);
    if(values.length>0)
        b.value = values[index];
    return b;
}

World.prototype.getNextBubble = function(){
    var b = this.nextBubble;
    this.nextBubble = this.createNextBubble();
    return b;
}

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
        }
    this.nextBubble = this.createNextBubble();
}

World.prototype.addBubble = function(b){
    this.bubbles.push(b);
}

World.prototype.log = function(){
    console.log("Tengo "+this.bubbles.length + " bubbles");
}

World.prototype.step = function(dt,frameTime){

    for(var t=0;t<=dt;t=t+frameTime){
        this.stepFiredBubbles(frameTime);
        this.testCollision();                
    }
    
    this.bubblegrid.step(dt);
    this.stepFreeBubbles(dt);
    this.pointTexts.step(dt);

}

World.prototype.stepFiredBubbles = function(dt){
    //update de posicion de la burbuja disparada
    if(this.firedBubbles.length >0){
        var b = this.firedBubbles[0];
        b.step(dt);
        //chequeo por rebotes en paredes
        if((b.p.x + b.v.x) <= this.bw/2 || (b.p.x + b.v.x) >= (this.w-this.bw/2))
            b.v.x *=-1;              
    }
}

World.prototype.stepFreeBubbles = function(dt){
    //update de posicion de las burbujas
    for(var i = 0; i<this.bubbles.length; i++){
        var b = this.bubbles[i];
        b.step(dt);
        //chequeo por rebotes en paredes
        if((b.p.x + b.v.x) <= this.bw/2 || (b.p.x + b.v.x) >= (this.w-this.bw/2))
            b.v.x *=-1;
        //chequeo por salidas del area de pantalla
        if(/*b.p.x > this.w ||*/ b.p.y > this.h /*|| b.p.y < 0(0-4*b.r)*/)
            this.deadBubbles.push(i);
    }    
    //quito las que no estan mas en pantallas;
    if(this.deadBubbles.length>0){
        for (var j = 0; j< this.deadBubbles.length;j++)
            this.bubbles[this.deadBubbles[j]] = null;
        this.bubbles = this.bubbles.filter(function(v){return (v!=null)});        
        this.deadBubbles.length = 0; 
    }
}

World.prototype.testCollision = function(){
    //si hay un disparo verifico fijacion
    for(var i = 0; i<this.firedBubbles.length;i++){
          var b = this.firedBubbles[i];
        
          var collides = false;
          
          for (var i = 0; i < this.bubblegrid.slots.length; i++)
            for (var j = 0; j < this.bubblegrid.slots[0].length; j++){
                var b2 = this.bubblegrid.slots[i][j];
                if(b2 && circlesColliding(b.p.x,b.p.y,b.r,b2.p.x,b2.p.y,b2.r)){
                    collides = true;
                    break;
                }
            }
          
          if(collides||(b.p.y<this.bh+this.bubblegrid.baseY)){
                var pos = this.bubblegrid.getCellIndexForCoord(b.p.x,b.p.y);
                //evito que se agrege a una celda no habilitada
                if (pos == null) pos = this.bubblegrid.getCellIndexForCoord(b.p.x+b.r,b.p.y);
                if (pos.j >= this.bubblegrid.slots[pos.i].length)  pos.j = pos.j-1;
                
                console.log("attach");
                this.bubblegrid.addBubble(b,pos.i,pos.j);
                this.bubblegrid.markBubble(pos.i,pos.j,b.value);
                console.log("se marcaron " + this.bubblegrid.marked.length);
                this.bubblegrid.popMarkedBubbles();
                this.bubblegrid.clearMarkedBubbles();
                this.bubblegrid.detachOrphanBubbles();
                this.firedBubbles.pop();
                this.moveGrid();
                
          }
    }
}

World.prototype.fireBubble = function(target){
    if(this.firedBubbles.length==0){
        this.shots++;
        var dir = {x:target.x-w.w/2,y:target.y-this.h+1};
        var b = this.getNextBubble();
        var norma = Math.sqrt(dir.x*dir.x+dir.y*dir.y);
        b.v.x = dir.x/norma *0.9;
        b.v.y = dir.y/norma * 0.9;
        this.firedBubbles.push(b);
    }
}

World.prototype.moveGrid = function(){

    switch (this.shots){
        case this.shotLimit:
            this.bubblegrid.lowerGrid();
            this.shots = 0;
            break;
        case this.shotLimit-1:
            this.bubblegrid.shake(true);
            break;
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

    function screen2World(pos,world){
        return {x:pos.x,y:pos.y};
    }

    var mouseclick = false;
    var mousepos = null;

    var c = document.getElementById("c");
    
    c.onclick = function(evt){
        mousepos = c.relMouseCoords(evt);
        mouseclick = true;
        console.log("click: " + mousepos.x + "," + mousepos.y);
    }
    
    dc = c.getContext("2d");

    // create world
    w = new World(c.width,c.height);
    w.setup();
        
    function gameLoop(oldtime){
    
        // calculate deltat
        var date = new Date();
        var now = date.getTime();
        var dt = now - oldtime ;        
        
        // process input
        if(mouseclick){
            var wpos = screen2World(mousepos,w);
            w.fireBubble(wpos);
            mouseclick = false;
        }

        // step world
        w.step(dt,1000/180/*iteration time*/);
        FPSCounter.frame();

        // draw
        Renderer.drawWorld(w,dc);

        // request next frame
        requestAnimationFrame(function(){gameLoop(now)},c);
    }

    // start loop
    gameLoop((new Date()).getTime());

}


window.onload = init;

// TODOS
/*
    - organizar todas las entidades que pueden ser steppeadas en una lista de entidades (lo que seria ahora world.bubbles)
    * organizar sprites de burbujas en distintos "spriteGroups" para relizar renders en forma diferenciada
        * uno para los del grid
        * uno para los popped
        * otro para el fired
    - agregar puntaje / tiempo
    * agregar sprites tipo texto
    - reescribir renderer para adaptarlo a viewport
    

*/
