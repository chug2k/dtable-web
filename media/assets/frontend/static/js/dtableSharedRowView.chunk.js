(this["webpackJsonpdtable-web"]=this["webpackJsonpdtable-web"]||[]).push([[6],{1351:function(e,t,a){e.exports=a(1364)},1352:function(e,t,a){},1353:function(e,t,a){},1354:function(e,t,a){},1364:function(e,t,a){"use strict";a.r(t);var n,r=a(6),c=a(7),l=a(10),o=a(8),i=a(9),u=a(0),s=a.n(u),m=a(22),p=a.n(m),b=a(199),f=a(30),h=a(38),v=function(e){function t(){return Object(r.a)(this,t),Object(l.a)(this,Object(o.a)(t).apply(this,arguments))}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return s.a.createElement("div",{className:"form-control cell-formatter grid-cell-type-text"},this.props.value)}}]),t}(s.a.Component),d=a(48),O="number",j=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).getValue=function(){var e=a.props,t=e.value,n=e.column;if(""!==t){var r=n.data&&n.data.format?n.data.format:O;t=Object(d.b)(t,r)}return t},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return s.a.createElement("div",{className:"form-control cell-formatter grid-cell-type-number"},this.getValue())}}]),t}(s.a.Component),y="YYYY-MM-DD",g=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).getValue=function(){var e=a.props,t=e.value,n=e.column,r=n.data&&n.data.format?n.data.format:y;return Object(d.a)(t,r)},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return s.a.createElement("div",{className:"form-control cell-formatter grid-cell-type-date"},this.getValue())}}]),t}(s.a.Component),E=a(142),w=function(e){function t(){return Object(r.a)(this,t),Object(l.a)(this,Object(o.a)(t).apply(this,arguments))}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props,t=e.value,a=e.column;return s.a.createElement("div",{className:"cell-formatter grid-cell-type-single-select"},s.a.createElement(E.a,{value:t,column:a}))}}]),t}(s.a.Component),C=function(e){function t(){return Object(r.a)(this,t),Object(l.a)(this,Object(o.a)(t).apply(this,arguments))}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props,t=e.value,a=e.column;return s.a.createElement("div",{className:"cell-formatter grid-cell-type-multiple-select"},t&&Array.isArray(t)&&t.map((function(e,t){return s.a.createElement(E.a,{key:t,value:e,column:a})})))}}]),t}(s.a.Component),k=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).getCollaborator=function(){var e=a.props.value;return window.app.collaborators.find((function(t){return t.email===e}))},a.getContainerStyle=function(){return{display:"inline-flex",alignItems:"center",marginRight:"10px",padding:"0 8px 0 2px",height:"20px",fontSize:"13px",borderRadius:"10px",background:"#eaeaea"}},a.getAvatarStyle=function(){return{display:"flex",alignItems:"center",margin:"0 4px 0 2px"}},a.getAvatarIconStyle=function(){return{width:"16px",height:"16px",borderRadius:"50%"}},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.getContainerStyle(),t=this.getAvatarStyle(),a=this.getAvatarIconStyle(),n=this.getCollaborator();return s.a.createElement("div",{className:"collaborator-container",style:e},s.a.createElement("span",{className:"collaborator-avatar",style:t},s.a.createElement("img",{className:"collaborator-avatar-icon",style:a,alt:n.name,src:n.avatar_url})),s.a.createElement("span",{className:"collaborator-name"},n.name))}}]),t}(s.a.Component),N=function(e){function t(){return Object(r.a)(this,t),Object(l.a)(this,Object(o.a)(t).apply(this,arguments))}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props.value;return s.a.createElement("div",{className:"cell-formatter grid-cell-type-collaborator"},e&&Array.isArray(e)&&e.map((function(e,t){return s.a.createElement(k,{key:t,value:e})})))}}]),t}(s.a.Component),A=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).getStyle=function(){return{display:"inline",marginLeft:"0",width:"20px",height:"20px",verticalAlign:"middle",boxShadow:"none",outline:"none",transform:"scale(1.1)"}},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"shouldComponentUpdate",value:function(e){return e.value!==this.props.value}},{key:"render",value:function(){var e=!0===this.props.value,t=this.getStyle();return s.a.createElement("div",{className:"cell-formatter grid-cell-type-checkbox"},s.a.createElement("input",{className:"checkbox",type:"checkbox",style:t,readOnly:!0,checked:e}))}}]),t}(s.a.Component),x=window.app.config.mediaUrl,S=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).onFileClick=function(){},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props.fileItem,t=Object(d.c)(x,e.name,e.type);return s.a.createElement("div",{className:"file-item"},s.a.createElement("img",{alt:"",src:t,onClick:this.onFileClick,title:e.name}))}}]),t}(s.a.Component),I=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).onFileItemClick=function(){},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props.value;return s.a.createElement("div",{className:"cell-formatter grid-cell-type-file"},e&&Array.isArray(e)&&e.map((function(e,t){return s.a.createElement(S,{key:t,fileItem:e})})))}}]),t}(s.a.Component),L=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).onImageDoubleClick=function(){},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return s.a.createElement("div",{className:"image-item"},s.a.createElement("img",{alt:"",src:this.props.imageItem,onDoubleClick:this.onImageDoubleClick}))}}]),t}(s.a.Component),T=function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).onImageClick=function(){},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props.value;return s.a.createElement("div",{className:"cell-formatter grid-cell-type-image"},e&&Array.isArray(e)&&e.map((function(e,t){return s.a.createElement(L,{key:t,imageItem:e})})))}}]),t}(s.a.Component),F=a(112),V=a(27),D=function(e){function t(e){var a;return Object(r.a)(this,t),(a=Object(l.a)(this,Object(o.a)(t).call(this,e))).formatterLongTextValue=function(e){F.a.process(e).then((function(e){var t=String(e);a.setState({isFormatValue:!1,innerHtml:t})}))},a.state={innerHtml:null,isFormatValue:!0},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){var e=this.props.value,t=e?e.text:"";t?this.formatterLongTextValue(t):this.setState({isFormatValue:!1,innerHtml:""})}},{key:"render",value:function(){return this.state.isFormatValue?s.a.createElement(V.a,null):s.a.createElement("div",{className:"cell-formatter grid-cell-type-longtext-formatter"},s.a.createElement("div",{dangerouslySetInnerHTML:{__html:this.state.innerHtml}}))}}]),t}(s.a.Component),R=(a(1352),n={},Object(f.a)(n,h.b.TEXT,s.a.createElement(v,null)),Object(f.a)(n,h.b.NUMBER,s.a.createElement(j,null)),Object(f.a)(n,h.b.DATE,s.a.createElement(g,null)),Object(f.a)(n,h.b.CHECKBOX,s.a.createElement(A,null)),Object(f.a)(n,h.b.SINGLE_SELECT,s.a.createElement(w,null)),Object(f.a)(n,h.b.MULTIPLE_SELECT,s.a.createElement(C,null)),Object(f.a)(n,h.b.COLLABORATOR,s.a.createElement(N,null)),Object(f.a)(n,h.b.FILE,s.a.createElement(I,null)),Object(f.a)(n,h.b.IMAGE,s.a.createElement(T,null)),Object(f.a)(n,h.b.LONG_TEXT,s.a.createElement(D,null)),n),M=(a(1353),function(e){function t(){var e,a;Object(r.a)(this,t);for(var n=arguments.length,c=new Array(n),i=0;i<n;i++)c[i]=arguments[i];return(a=Object(l.a)(this,(e=Object(o.a)(t)).call.apply(e,[this].concat(c)))).getCellFormatter=function(){var e=a.props.column.type;return R[e]},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){var e=this.props,t=e.value,a=e.column,n=this.getCellFormatter();return s.a.createElement("div",{className:"share-row-item"},s.a.createElement(b.a,{column:a}),n&&s.a.cloneElement(n,{value:t,column:a}))}}]),t}(s.a.Component)),_=a(14),H=window.shared.pageOptions,U=H.workspaceID,B=H.dtableName,J=function(e){function t(e){var a;return Object(r.a)(this,t),(a=Object(l.a)(this,Object(o.a)(t).call(this,e))).renderRowItems=function(){var e=a.props,t=e.row,n=e.columns,r=[];return n.forEach((function(e,a){var n=t[e.key],c=s.a.createElement(M,{key:a,value:n,column:e});r.push(c)})),r},a.state={isLoadingCollaborator:!0},a}return Object(i.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){var e=this;_.a.getTableRelatedUsers(U,B).then((function(t){var a=t.data?t.data.user_list:[];window.app=window.app?window.app:{},window.app.collaborators=a,e.setState({isLoadingCollaborator:!1})}))}},{key:"render",value:function(){if(this.state.isLoadingCollaborator)return s.a.createElement(V.a,null);var e=this.props.row["0000"];return s.a.createElement("div",{className:"app-main"},s.a.createElement("div",{className:"".concat(this.props.mode," dtable-share-row-container")},s.a.createElement("div",{className:"dtable-share-row-title"},s.a.createElement("h3",null,e)),s.a.createElement("div",{className:"dtable-share-row-items"},this.renderRowItems())))}}]),t}(s.a.Component);J.defaultProps={mode:"form_mode"};var Y=J,G=(a(1354),window.shared.pageOptions),X=G.rowContent,P=G.columns,z=function(e){function t(){return Object(r.a)(this,t),Object(l.a)(this,Object(o.a)(t).apply(this,arguments))}return Object(i.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return s.a.createElement(Y,{row:JSON.parse(X).row,columns:JSON.parse(P).columns})}}]),t}(s.a.Component);p.a.render(s.a.createElement(z,null),document.getElementById("wrapper"))},142:function(e,t,a){"use strict";var n=a(6),r=a(7),c=a(10),l=a(8),o=a(9),i=a(0),u=a.n(i),s=(a(488),function(e){function t(){var e,a;Object(n.a)(this,t);for(var r=arguments.length,o=new Array(r),i=0;i<r;i++)o[i]=arguments[i];return(a=Object(c.a)(this,(e=Object(l.a)(t)).call.apply(e,[this].concat(o)))).getCurrentOption=function(){var e=a.props,t=e.value;return e.column.data.options.find((function(e){return e.id===t}))},a.getStyle=function(){var e=a.getCurrentOption(),t={backgroundColor:e.color,color:e.textColor||null};return e?t:null},a}return Object(o.a)(t,e),Object(r.a)(t,[{key:"render",value:function(){var e=this.props,t=e.value,a=e.column,n=this.getCurrentOption();if(!t||!a.data||!a.data.options||!n)return u.a.createElement("div",null);var r=this.getStyle();return u.a.createElement("div",{style:r,className:"select-option"},n.name)}}]),t}(u.a.Component));t.a=s},488:function(e,t,a){}},[[1351,1,0]]]);
//# sourceMappingURL=dtableSharedRowView.chunk.js.map