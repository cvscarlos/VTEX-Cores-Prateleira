/**
* Cores Na Prateleira
* @author Carlos Vinicius
* @version 5.0
* @date 2011-10-10
*/
if("function"!==typeof(String.prototype.trim))String.prototype.trim=function(){ return this.replace(/^\s+|\s+$/g,""); };
jQuery.fn.coresPrateleira=function(opts)
{
	var $e,fn,log,debug,extTitle,debugOn,getParent;
	
	$e=jQuery("");
	
	debugOn=document.location.href.toLowerCase().indexOf("debugcp")>-1;
	extTitle="Cores Prateleira";
	log=function(msg,type){
		if(typeof console=="object")
			console.log("["+extTitle+" - "+(type||"Erro")+"] "+msg);
	};
	debug=function(msg,type){
		if(typeof console=="object" && debugOn)
			console.log("[debug]["+extTitle+" - "+(type||"Erro")+"] "+msg);
	};
	
	getParent=function(startElem,searchElemStr)
	{
		var p;
		p=startElem.parent();
		
		if(p.is("html"))
			return jQuery("");
		else if(p.is(searchElemStr))
			return p;
		else if(!p.length)
			return p;
		else
			return getParent(p,searchElemStr);
	};
	
	fn=
	{
		loadSkuJqxhr:null,
		productOriginalInfo:null,
		productOriginalLink:null,
		productOriginalSave:null,
		saveCount:0,
		onHover:false,
		skuList:[],
		skuQueue:[],
		productShelf:null,
		skuGroup:{},
		options:
		{
			productsLi:">ul li", // Seletor jQuery para encontrar as "<li>" a partir do que foi definido em "productShelf"
			ajaxCallback:function(){}, // callback chamado ao concluir com sucesso a requisição ajax
			callback:function(){}, // Callback ao término da execução de todas as funções, não lenvando em consideraçao as requisições ajax
			messageRequestFail:"Não foi posssível obter as informações deste item.", // mensagem exibida quando existe falha na requisição
			saveText:"Economize: R$ #value", // Texto de "economize"
			speedFade:200, // velocidade da transição das imagens
			thumbsQuantity:4, // Quantidade máxima de thumbs a serem exibidos na vitrine
			currency:"R$ ", // Define o tipo de moeda que será adicionao junto ao valor do produto.
			restoreOriginalDetails:false, // Define se quando o usuário "tirar" o mouse de cima do elemento o valor atual será mantido ou se retornará ao valor oginal do produto.
			checkLinkEquals:false, // Checar se o link do produto é o mesmo que vem no "campo produto"
			forceAvailable:false, // Exibir ou não a informação de produto indisponível. Caso seja definido como "true" serão exibidos os dados de preço/parcelamento mesmo p/ um SKU indisponível
			forceImgList:false, // Força a exibição das miniaturas mesmo quando o produto esta esgotado, esta regra é ignorada quando "forceAvailable" esta como "true"
			autoSetup:true, // O script tenta pré configurar a prateleira automaticamente
			checkIsAvaliable:false, // Habilitar a verificação recursiva de todos os Skus cadastrados no campo produto para tentar encontrar algum disponível
			minSkuQttShow:2, // Quantidade miníma de SKUs necessários para exibir as miniaturas
			productImgId:30, // Id do tamanho da imagem a ser exibida na prateleira
			thumbImgId:3, // Id do thumb a ser exibido abaixo da foto do produto
			action:2 // Parametro que define qual ação tomar para controlar os eventos do mouse. // Descontinuada
		},
		init:function(options)
		{
			jQuery.extend(fn.options, options);
			// chamando as funções
			fn.createSkuElementsList();
			fn.options.callback();
		},
		createSkuElementsList:function()
		{
			var productShelf=fn.productShelf;
			if(productShelf.length>0)
			{
				productShelf.each(function(ndx){
					var $this=jQuery(this);
					if(!$this.hasClass("vtex-cpIsActivated"))
						v=fn.exec($this,ndx);
				});
			}
		},
		exec:function(productShelf,index)
		{
			var productsList=productShelf.find(fn.options.productsLi);
			// Reporting Errors
			if(productsList.length<1){log("Prateleira não encontrada \n ("+productsList.selector+")"); return false;}

			productShelf.addClass("vtex-cpIsActivated");
			productsList.each(function(ndx1){
				var $this,skuList,productField,skuArrayAll,skuArray,objsKey,linkEquals;
				
				$this=jQuery(this);
				
				if(true===fn.options.autoSetup)
					fn.shelfSetup($this);
				
				skuList=$this.find(".vtex-cpSkuList");
				productField=$this.find(".vtex-cpProductField");
				skuArrayAll=productField.find("li").text().trim().split("|");
				
				if(debugOn)
				{
					if(productField.find("li").text().trim()=="")
						debug("O campo produto não esta retornando nenhum valor.\n Produto: "+($this.find(".vtex-cpProductLink[title]:first").attr("title")||"[Título não encontrado]"),"Aviso");
				}
				
				// Agrupando Skus duplicados
				objsKey=index.toString()+"_"+ndx1.toString();
				skuArray=fn.groupSku(skuArrayAll,objsKey);                
				
				$this.find(".vtex-cpProductImage img").addClass("vtex-cpOriginalImage");
				skuArrayLength=skuArray.length;

				if(fn.options.forceAvailable || fn.options.forceImgList)
					skuList.addClass("vtex-cpShow").removeClass("vtex-cpHide");

                if(skuArrayLength>=fn.options.minSkuQttShow)
					for(var i=0; i<skuArrayLength; i++)
					{
						var skuId,link;
						skuId=skuArray[i][1];
						link=skuArray[i][0].trim();
						
						if(fn.options.checkLinkEquals)
						{
							linkEquals=link.replace(/http\:\/\/[a-z-\.]+(?=\/)/i,"")==($this.find(".vtex-cpProductLink:first").attr("href")||"").trim().replace(/http\:\/\/[a-z-\.]+(?=\/)/i,"");
							if(linkEquals)
							{
								debug("O sku “"+skuId+"” foi ignorado pois tem o mesmo link que o produto existente na vitrine.\n URI: "+link.trim().replace(/http\:\/\/[a-z-\.]+(?=\/)/i,""),"Aviso");
								continue;
							}
						}
						
						if(i>=fn.options.thumbsQuantity)
						{
							$this.find(".vtex-cpViewMore").addClass("vtex-cpShow").removeClass("vtex-cpHide");
							break;
						}
						else if(skuId!="")
							if(!(skuArrayLength>fn.options.thumbsQuantity && i>=(fn.options.thumbsQuantity-1)))
								skuList.append(
									fn.setThumbs($this,skuId,jQuery("<span class='vtex-cpSkuIds vtex-cpIndex_"+i+" vtex-cpSkuId_"+skuId+(i==0?" vtex-cpFirst":"")+"'><span class='vtex-cpInner'></span><span class='vtex-cpInner2'></span></span>"),link,objsKey)
								);
					}
			});
		},
		groupSku:function(skuArrayAll,key)
		{
			var skuObj={},skuObjOrder={},out=[],tmp,first,last,lg;
			lg=skuArrayAll.length;
			
			if(lg<2 && skuArrayAll[0]=="")
				return out;
			
			for(var i=0; i<lg; i++)
			{
				tmp=skuArrayAll[i].split(";");
				first=tmp.pop();
				last=tmp.shift();
				
				if(typeof first!="undefined")
				{
					if(typeof skuObj[last]=="undefined")
						skuObj[last]=[first];
					else
						skuObj[last].push(first);
				}
			}
			
			for(ndx in skuObj)
			{
				var lg=skuObj[ndx].length,
					tmp2=[];

				if(lg>3)
				{
					var part=parseInt(lg/3),
						remainder=lg%3,
						j=part*2;

					for(i=0; i<part; i++)
					{
						tmp2.push(skuObj[ndx][i]);
						tmp2.push(skuObj[ndx][i+part]);
						tmp2.push(skuObj[ndx][i+j]);
					}

					if(remainder==1)
						tmp2.push(skuObj[ndx][lg-1]);
					else if(remainder==2)
					{
						tmp2.push(skuObj[ndx][lg-1]);
						tmp2.push(skuObj[ndx][lg-2]);
					}
				}
				else
					tmp2=skuObj[ndx];

				out.push([tmp2.shift(),ndx]);
				skuObjOrder[ndx]=tmp2;
			}
			
			fn.skuGroup[key]=skuObjOrder;
			return out;
		},
		setThumbs:function(liElem, skuId, elem, link, objsKey)
		{
			var overlay=liElem.find(".vtex-cpOverlay");
			elem.addClass("vtex-cpLoadingData");
			fn.loadSku(liElem, skuId, overlay, fn.options.action, elem, link, objsKey);
			return elem;
		},
		checkIsAvaliable:function(liElem, skuId, elem, data, link, objsKey)
		{
			if(data[0].Availability || !fn.options.checkIsAvaliable)
				fn.mouseActions2(liElem, skuId, elem, data, link);
			else
			{
				var overlay=liElem.find(".vtex-cpOverlay");
				
				if(typeof fn.skuGroup[objsKey][link] !="undefined" && fn.skuGroup[objsKey][link].length>0)
					fn.loadSku(liElem, fn.skuGroup[objsKey][link].shift(), overlay, fn.options.action, elem, link, objsKey);
				else
					fn.mouseActions2(liElem, skuId, elem, data, link);
			}
		},
		mouseActions2:function(liElem, skuId, elem, data, link)
		{
			fn.setImgThumb(elem, data);
			fn.setClass(elem, data);
			elem.bind({
				"mouseenter":function()
				{
					liElem.find(".vtex_cpActiveSku").removeClass("vtex_cpActiveSku");
					elem.addClass("vtex_cpActiveSku");
					fn.productOriginalInfo=liElem.find(".vtex-cpProductInfoWrap").children().clone();
					fn.productOriginalLink=liElem.find(".vtex-cpProductLink:first").attr("href")||"";
					var cpSave=liElem.find(".vtex-cpSave");
					fn.productOriginalSave=[(cpSave.html()||""),(cpSave.attr("class")||"")];
					fn.formatInfo(data, liElem, link);
					fn.onHover=true;
				}
			});
			if(fn.options.restoreOriginalDetails)
				elem.bind({
					"mouseleave":function()
					{
						liElem.find(".vtex_cpActiveSku").removeClass("vtex_cpActiveSku");
						fn.setOriginalElements(liElem);
						fn.onHover=false;
					}
				});
			
			return elem;
		},
		mouseActions:function(parent, skuId, elem)
		{
			elem.bind({
				"mouseenter":function()
				{
					parent.find(".vtex_cpActiveSku").removeClass("vtex_cpActiveSku");
					elem.addClass("vtex_cpActiveSku");
					var overlay=parent.find(".vtex-cpOverlay").show();
					fn.loadSku(parent, skuId, overlay);
					fn.productOriginalInfo=parent.find(".vtex-cpProductInfoWrap").children().clone();
					fn.onHover=true;
				},
				"mouseleave":function()
				{
					parent.find(".vtex_cpActiveSku").removeClass("vtex_cpActiveSku");
					parent.find(".vtex-cpOverlay").hide();
					fn.loadSkuJqxhr.abort();
					fn.setOriginalElements(parent);
					fn.onHover=false;
				}
			});
			
			return elem;
		},
		formatInfo:function(data, liElem, link)
		{
			liElem.addClass("vtex-cpInfoFromSKU");
			var obj=data[0];
			
			if(obj.Availability || fn.options.forceAvailable)
			{
				var pInfo=liElem.find(".vtex-cpProductInfo");
				
				pInfo.addClass("vtex-cpShow").removeClass("vtex-cpHide");
				liElem.find(".vtex-cpProductUnavailable").addClass("vtex-cpHide").removeClass("vtex-cpShow");
				
				pInfo.find(".vtex-cpBestPrice").text(fn.options.currency+fn.numberFormat(obj.Price));
				
				liElem.find(".vtex-cpSave").html(fn.options.saveText.replace("#value",fn.numberFormat(obj.ListPrice-obj.Price)));
				if(obj.Price<obj.ListPrice)
				{
					pInfo.find(".vtex-cpListPriceWrap").addClass("vtex-cpShow").removeClass("vtex-cpHide").find(".vtex-cpListPrice").text(fn.options.currency+fn.numberFormat(obj.ListPrice));
					liElem.find(".vtex-cpSave").addClass("vtex-cpShow").removeClass("vtex-cpHide");
				}
				else
				{
					pInfo.find(".vtex-cpListPriceWrap").addClass("vtex-cpHide").removeClass("vtex-cpShow");
					liElem.find(".vtex-cpSave").addClass("vtex-cpHide").removeClass("vtex-cpShow");
				}
				
				if(obj.BestInstallmentNumber>1)
				{
					var installment=pInfo.find(".vtex-cpInstallment").addClass("vtex-cpShow").removeClass("vtex-cpHide");
					installment.find(".vtex-cpNumbersOfInstallment").text(obj.BestInstallmentNumber);
					installment.find(".vtex-cpInstallmentValue").text(fn.options.currency+fn.numberFormat(obj.BestInstallmentValue));
					pInfo.find(".vtex-cpFullRegularPrice").addClass("vtex-cpHide").removeClass("vtex-cpShow");
				}
				else
				{
					pInfo.find(".vtex-cpInstallment").addClass("vtex-cpHide").removeClass("vtex-cpShow");
					pInfo.find(".vtex-cpFullRegularPrice").addClass("vtex-cpShow").removeClass("vtex-cpHide")
				}
				
			}
			else
			{
				liElem.find(".vtex-cpProductInfo").addClass("vtex-cpHide").removeClass("vtex-cpShow");
				liElem.find(".vtex-cpProductUnavailable").addClass("vtex-cpShow").removeClass("vtex-cpHide");
			}
			
			var imgWrap=liElem.find(".vtex-cpProductImage");
			var imgOverlay=liElem.find(".vtex-cpImgOverlay");
			var originalImage=imgWrap.find(".vtex-cpOriginalImage");
			var _originalImage=originalImage[0];
			var originalImage2=originalImage.clone();
			var imgWidth=(originalImage2.attr("width")||_originalImage.naturalWidth);
			var imgHeight=(originalImage2.attr("height")||_originalImage.naturalHeight);
			var images=fn.getImageUrl(obj, fn.options.productImgId);
			var skuImg=liElem.find("img[src*='"+(images[0]||originalImage.attr("src"))+"']");
			var imageExist=(skuImg.length>0)?true:false;
			var img=jQuery('<img src="'+(images[0]||originalImage.attr("src"))+'" alt="" '+(("undefined"!==typeof imgWidth)?'width="'+imgWidth+'"':"")+' '+(("undefined"!==typeof imgHeight)?'height="'+imgHeight+'"':"")+' class="vtex-cpSkuImage" style="display:none;" />');
			
			if(link!="")
				liElem.find(".vtex-cpProductLink").attr("href",link.replace(/http\:\/\/[a-z-\.]+(?=\/)/i,""));
			
			imgOverlay.show();
			if(imageExist)
			{
				originalImage.stop(true).fadeOut(fn.options.speedFade);
				imgOverlay.hide();
				liElem.find(".vtex-cpSkuImage").stop(true).fadeOut(fn.options.speedFade);
				skuImg.stop(true).fadeTo(fn.options.speedFade,1.0);
			}
			else
			{
				img.load(function(){
					if(fn.onHover)
					{
						originalImage.stop(true).fadeOut(fn.options.speedFade);
						imgOverlay.hide();
						liElem.find(".vtex-cpSkuImage").stop(true).fadeOut(fn.options.speedFade);
						img.stop(true).fadeTo(fn.options.speedFade,1.0);
					}
					else
					{
						imgOverlay.hide();
						fn.setOriginalImg(liElem);
					}
				});
				imgWrap.append(img);
			}
		},
		setOriginalElements:function(liElem)
		{
			if(fn.productOriginalInfo!=null && liElem.hasClass("vtex-cpInfoFromSKU"))
			{
				liElem.removeClass("vtex-cpInfoFromSKU").find(".vtex-cpProductInfoWrap").html(fn.productOriginalInfo);
				fn.setOriginalImg(liElem);
				fn.setOriginalLink(liElem);
				fn.setOriginalSaveText(liElem);
			}
		},
		setOriginalImg:function(liElem)
		{
			var imageLink=liElem.find(".vtex-cpProductImage");
			imageLink.find(":not(.vtex-cpOriginalImage)").stop(true).fadeOut(fn.options.speedFade);
			imageLink.find(".vtex-cpOriginalImage").stop(true).fadeTo(fn.options.speedFade,1.0);
		},
		setOriginalLink:function(liElem)
		{
			liElem.find(".vtex-cpProductLink").attr("href", fn.productOriginalLink);
		},
		setOriginalSaveText:function(liElem)
		{
			liElem.find(".vtex-cpSave").html(fn.productOriginalSave[0]).attr("class",fn.productOriginalSave[1]);
		},
		setImgThumb:function(elem, data)
		{
			var img=fn.getImageUrl(data[0],fn.options.thumbImgId);
			elem.removeClass("vtex-cpLoadingData");
            
			if(img.length>0)
			{
				elem.css("background-image","url('"+img[0]+"')");
				elem.find(".vtex-cpInner").append('<img src="'+img[0]+'" alt="" class="vtex-cpImgsThumb vtex-cpThumb_'+data[0].Id+'" alt=""/>');
			}
		},
		loadSku:function(liElem, skuId, overlay, action, span, link, objsKey)
		{
			var _overlay=overlay||{};
			action=action||1;
			span=span||$e;
			skuId=skuId.toString().trim();
			
			var skuIdString=skuId.toString();
			if("undefined"!==typeof(fn.skuQueue[skuIdString]))
			{
				fn.skuQueue[skuIdString].push({
					"liElem":liElem,
					"skuId":skuId,
					"span":span,
					"link":link
				});
			}
			else
			{
				fn.skuQueue[skuIdString]=[];

				fn.loadSkuJqxhr = jQuery.ajax({
					"url":"/produto/sku/"+skuId,
					"data":"json",
					"success":function(data, textStatus, jqXHR)
					{
						if("object"!==typeof data)
						{
							log(fn.options.messageRequestFail+"\n skuId: "+skuId+"\n(textStatus:'"+textStatus+"', jqXHR:'"+jqXHR+"')");
							span.hide();
							return false;
						}
						else if(jqXHR.status!=0)
						{
							fn.skuQueue[skuIdString].push({
								"liElem":liElem,
								"skuId":skuId,
								"span":span,
								"link":link
							});
							
							var queueLength=fn.skuQueue[skuIdString].length;
							var queue=fn.skuQueue[skuIdString];
							for(var i=0; i<queueLength; i++)
							{
								switch(action)
								{
									case 1:
										fn.formatInfo(data, queue[i].liElem);
										break;
									case 2:
										fn.checkIsAvaliable(queue[i].liElem, queue[i].skuId, queue[i].span, data, queue[i].link, objsKey);
										break;
								}
							}

							fn.skuQueue[skuIdString]=undefined;
							fn.options.ajaxCallback();
						}
					},
					"error":function(jqXHR, textStatus, errorThrown)
					{
						log(fn.options.messageRequestFail+"\n skuId: "+skuId+"\n(textStatus:'"+textStatus+"', jqXHR:'"+jqXHR+"', errorThrown:'"+errorThrown+"')");
						span.hide();
					}
				});
			}
		},
		numberFormat:function(val)
		{
			var out="",_char="", thousandsFormatted="";
			var values=val.toFixed(2).split(".");
			var numbers=values[0].split("");
			var i=0;
			var numLength=numbers.length;
			var thousandsSeparator=".";
			for (var j=values[0].length; j>0 ;j--)
			{
				_char = values[0].substr(j-1,1);
				i++;
				if (i%3==0 && numLength>i)
					_char = thousandsSeparator+_char;
				thousandsFormatted = _char+thousandsFormatted;
			}
			out=thousandsFormatted+","+values[1];
			return out;
		},
		getImageUrl:function(obj, typeId)
		{
			var out=[];
			
			if(obj.Images.length<1)
			{
				log("Não foram encontradas imagens para o SKU: "+obj.Id);
				return out;
			}
			
			for(array in obj.Images)
				for(img in obj.Images[array])
					if(obj.Images[array][img].ArchiveTypeId==typeId)
					{
						out.push(obj.Images[array][img].Path);
						break;
						break;
					}

			return out;
		},
		setClass:function(elem, data)
		{
			var name=data[0].Name.replace(/[^a-zA-Z0-9\-\_]/g,"");
			elem.addClass("vtex-cp_"+name);
		},
		shelfSetup:function(li)
		{
			// Classe nos links
			li.find("a[href='"+li.find(".vtex-cpUri").val()+"']").addClass("vtex-cpProductLink");
			// Imagem do produto
			var largeImg=null,LargeImgW=0;
			li.find("img").each(function(){
				var $t=jQuery(this);
				largeImg=null===largeImg?$t:largeImg;
				if(LargeImgW<($t.attr("width")||0))
					largeImg=$t;
			});
			largeImg.before('<div class="vtex-cpImgOverlay"></div>');
			largeImg.parent().addClass("vtex-cpProductImage");
			// Informações do produto
			var txtWrap=jQuery('<span class="vtex-cpProductTextWrap"><div class="vtex-cpOverlay"></div></span>'),
				infoWrap=jQuery('<span class="vtex-cpProductInfoWrap"></span>'),
				pInfo=li.find(".vtex-cpProductInfo");
			pInfo.before(txtWrap);
			pInfo.appendTo(infoWrap);
			li.find(".vtex-cpProductUnavailable").appendTo(infoWrap);
			infoWrap.appendTo(txtWrap);
			// Economia
			if(fn.saveCount<1)
			{
				var re=/\sR\$\s[0-9]+,[0-9]{1,2}/i,
					saveTxt=li.find(".vtex-cpSave").text();
				if(saveTxt.search(re)>-1)
					fn.options.saveText=saveTxt.replace(re," R$ #value");
				fn.saveCount++;
			}
		}
	};
	
	fn.productShelf=jQuery(this);
	fn.init(opts);
	return fn.productShelf;
};