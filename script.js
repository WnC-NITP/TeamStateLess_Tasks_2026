
let rows=10;
let cols=6;
let data=JSON.parse(localStorage.getItem("sheetdata")||"{}");
let selected=null,undo=[],redo=[];

const t=document.getElementById("sheet");
const formulae=document.getElementById("formulabar");
const celll=document.getElementById("celll");
const status=document.getElementById("status");

const col = function(n) {
   return String.fromCharCode(65 + n);
};
function val(id){
  return Number((data[id]||{}).value)||0;
}
function save(){
  localStorage.setItem("sheetdata",JSON.stringify(data));status.textContent="Saved";
}
function auto(){
  clearTimeout(window.tm);window.tm=setTimeout(save,300);
}
function evalf(f){
 try{
  let m=f.match(/^=(SUM|AVG|MIN|MAX)\(([A-Z]\d+):([A-Z]\d+)\)$/i);
  if(m){
    let fn=m[1].toUpperCase(),c=m[2][0],s=+m[2].slice(1),e=+m[3].slice(1),a=[];
    for(let i=s;i<=e;i++)a.push(val(c+i));
    if(fn=="SUM")return a.reduce((x,y)=>x+y,0);
    if(fn=="AVG")return (a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);
    if(fn=="MIN")return Math.min(...a);
    return Math.max(...a);
  }
  let ex=f.slice(1).replace(/[A-Z]\d+/g,function(cell) {
   return val(cell);
});
  return Function("return "+ex)();
 }
 catch{return "Invalid Formula";
 }
}
function grid(){
 t.innerHTML="";
 let hr=document.createElement("tr");
 hr.innerHTML="<th></th>";
 for(let c=0;c<cols;c++){
  let h=document.createElement("th");
  h.textContent=col(c);
  hr.appendChild(h)
}
t.appendChild(hr);
 for(let r=1;r<=rows;r++){
  let tr=document.createElement("tr");
  rh=document.createElement("th");
  rh.textContent=r;
  tr.appendChild(rh);
  for(let c=0;c<cols;c++){
    let td=document.createElement("td");
    td.contentEditable=true;
    let id=col(c)+r;
    td.dataset.id=id;
    td.textContent=(data[id]||{}).value||"";
    td.onfocus=()=>{
      document.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
      selected=td;
      td.classList.add("selected");
      celll.textContent=id;
      formulae.value=(data[id]||{}).formula||td.textContent;
    }
    td.onblur=()=>update(td,td.textContent);
    td.onkeydown=(e)=>{
      let rr=r;
      let cc=c;
      if(e.key=="ArrowRight")focus(rr,cc+1);
      if(e.key=="ArrowLeft")focus(rr,cc-1);
      if(e.key=="ArrowDown"||e.key=="Enter")focus(rr+1,cc);
      if(e.key=="ArrowUp")focus(rr-1,cc);
    };
    tr.appendChild(td);
  }
  t.appendChild(tr);
 }
}
function focus(r,c){
  if(r<1||c<0||c>=cols||r>rows){
    return;
    setTimeout(()=>document.querySelector(`[data-id='${col(c)+r}']`).focus(),0)
  }
}
function update(td,input){
 let id=td.dataset.id;
 let old=data[id]||{formula:"",value:""};
 undo.push({id,old:{...old}});
 redo=[];
 if(input.startsWith("=")){let out=evalf(input);data[id]={formula:input,value:out};td.textContent=out;
}
 else data[id]={formula:"",value:input};
 auto();
}
formulae.onkeydown=e=>{if(e.key=="Enter"&&selected){selected.textContent=formulae.value;update(selected,formulae.value)}}
document.getElementById("addrow").onclick=()=>{rows++;grid()}
document.getElementById("addcol").onclick=()=>{cols++;grid()}
document.getElementById("clear").onclick=()=>{data={};save();grid()}
document.getElementById("search").oninput=e=>{
 let q=e.target.value.toLowerCase();
 document.querySelectorAll("td").forEach(td=>{
   td.classList.toggle("hit",q&&td.textContent.toLowerCase().includes(q));
 });
}
document.getElementById("undo").onclick=()=>{
 let h=undo.pop();if(!h)return;redo.push({id:h.id,old:{...(data[h.id]||{})}});data[h.id]=h.old;grid();
}
document.getElementById("redo").onclick=()=>{
 let h=redo.pop();if(!h)return;undo.push({id:h.id,old:{...(data[h.id]||{})}});data[h.id]=h.old;grid();
}
grid();
