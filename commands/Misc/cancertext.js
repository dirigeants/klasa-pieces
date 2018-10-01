/* eslint-disable id-length, complexity */

const { Command } = require('klasa');

const a = 'ἀἁἂἃἄἅἆἇἈἉἊἋἌἍἎἏⒶⓐ⒜AaẠạẢảḀḁÂÃǍǎẤấẦầẨẩȂȃẪẫẬậÀÁẮắẰằẲẳẴẵẶặĀāĄąǞȀȁÅǺǻÄäǟǠǡâáåãàẚȦȧȺÅⱥÆæǼǢǣⱯꜲꜳꜸꜺꜹꜻªΛΔ';
const b = 'ẞßβⒷⓑ⒝BbḂḃḄḅḆḇƁɃƀƃƂƄƅℬ';
const c = 'Ⓒⓒ⒞CcḈḉĆćĈĉĊċČčÇçƇƈȻȼℂ℃ℭƆϾϽ';
const d = 'Ⓓⓓ⒟DdḊḋḌḍḎḏḐḑḒḓĎďƊƋƌƉĐđȡⅅⅆǱǲǳǄǅǆȸ';
const e = 'Ⓔⓔ⒠EeḔḕḖḗḘḙḚḛḜḝẸẹẺẻẾếẼẽỀềỂểỄễỆệĒēĔĕĖėĘęĚěÈèÉéÊêËëȄȅȨȩȆȇƎⱸɆℇℯ℮ƐℰƏǝⱻɇΞΣ';
const f = 'Ⓕⓕ⒡FfḞḟƑƒꜰℲⅎꟻℱ℻';
const g = 'Ⓖⓖ⒢GgƓḠḡĜĝĞğĠġĢģǤǥǦǧǴℊ⅁ǵ';
const h = 'Ⓗⓗ⒣HhḢḣḤḥḦḧḨḩḪḫẖĤĥȞȟĦħⱧⱨꜦℍǶℏℎℋℌꜧ';
const i = 'Ⓘⓘ⒤IiḬḭḮḯĲĳìíîïÌÍÎÏĨĩĪīĬĭĮįıƗƚỺǏǐⅈȉȈȊȋἰἱἲἳἴἵἶἷἸἹἺἻἼἽἾἿ';
const j = 'ℑℐⒿⓙ⒥JjĴĵȷⱼɈɉǰ';
const k = 'Ⓚⓚ⒦KkḰḱḲḳḴḵĶķƘƙꝀꝁꝂꝃꝄꝅǨǩⱩⱪĸ';
const l = 'Ⓛⓛ⒧LlḶḷḸḹḺḻḼḽĹĺĻļĽİľĿŀŁłỈỉỊịȽⱠꝈꝉⱡⱢꞁℒǇǈǉ⅃⅂ℓ℄';
const m = 'ⓜ⒨MmḾḿṀṁṂṃꟿꟽⱮƩƜℳ';
const n = 'Ⓝⓝ⒩NnṄṅṆṇṈṉṊṋŃńŅņŇňǸǹŊƝñŉÑȠƞŋǊǋǌȵℕ№ᾐᾑᾒᾓᾔᾕᾖᾗ';
const o = 'OoṌṍṎṏṐṑṒṓȪȫȬȭȮȯȰȱǪǫǬǭỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợƠơŌōŎŏŐőÒÓÔÕÖǑȌȍȎȏŒœØǾꝊǽǿℴ⍥⍤Ⓞⓞ⒪òóôõöǒøꝎꝏὀὁὂὃὄὅὈὉὊὋὌὍΘΦ';
const p = 'Ⓟⓟ⒫℗PpṔṕṖṗƤƥⱣℙǷꟼ℘Ϸϸῤῥ';
const q = 'ⓠ⒬QqɊɋℚ℺ȹ';
const r = 'Ⓡⓡ⒭RrŔŕŖŗŘřṘṙṚṛṜṝṞṟȐȑȒȓɍɌƦⱤ℞Ꝛꝛℜℛ℟ℝ';
const s = 'Ⓢⓢ⒮SsṠṡṢṣṤṥṦṧṨṩŚśŜŝŞşŠšȘșȿꜱƧƨϟϨϩ';
const t = 'Ⓣⓣ⒯TtṪṫṬṭṮṯṰṱŢţŤťŦŧƬƮẗȚȾƫƭțⱦȶ℡™ͲͳϮϯ';
const u = 'Ⓤⓤ⒰UuṲṳṴṵṶṷṸṹṺṻỤỦủỨỪụứỬửừữỮỰựŨũŪūŬŭŮůŰűǙǚǗǘǛǜŲųǓǔȔȕÛûȖȗÙùÜüƯúɄưƲƱΰῠῡῢΰμ';
const v = 'Ⓥⓥ⒱VvṼṽṾṿỼɅ℣ⱱⱴⱽν';
const w = 'Ⓦⓦ⒲WwẀẁẂẃẄẅẆẇẈẉŴŵẘⱲⱳώωϢϣ';
const x = 'Ⓧⓧ⒳XxẊẋẌẍℵ×';
const y = 'Ⓨⓨ⒴yYẎẏỾỿẙỲỳỴỵỶỷỸỹŶŷƳƴŸÿÝýɎɏȲƔ⅄ȳℽλϒϓϔΨ';
const z = 'Ⓩⓩ⒵ZzẐẑẒẓẔẕŹźŻżŽžȤȥⱫⱬƵƶɀℨℤ';

module.exports = class CancerText extends Command {

	constructor(...args) {
		super(...args, {
			requiredPermissions: ['SEND_MESSAGES'],
			description: 'What could be more cancer than this?',
			usage: '<text:string{1,150}>'
		});
	}

	async run(msg, [text]) {
		const cancerCharacters = [];

		for (var ii = 0, len = text.length; ii < len; ii++) {
			if (text[ii].toLowerCase() === 'a') {
				cancerCharacters.push(a[Math.floor(Math.random() * a.length) + 1]);
			} else if (text[ii].toLowerCase() === 'b') {
				cancerCharacters.push(b[Math.floor(Math.random() * b.length) + 1]);
			} else if (text[ii].toLowerCase() === 'c') {
				cancerCharacters.push(c[Math.floor(Math.random() * c.length) + 1]);
			} else if (text[ii].toLowerCase() === 'd') {
				cancerCharacters.push(d[Math.floor(Math.random() * d.length) + 1]);
			} else if (text[ii].toLowerCase() === 'e') {
				cancerCharacters.push(e[Math.floor(Math.random() * e.length) + 1]);
			} else if (text[ii].toLowerCase() === 'f') {
				cancerCharacters.push(f[Math.floor(Math.random() * f.length) + 1]);
			} else if (text[ii].toLowerCase() === 'g') {
				cancerCharacters.push(g[Math.floor(Math.random() * g.length) + 1]);
			} else if (text[ii].toLowerCase() === 'h') {
				cancerCharacters.push(h[Math.floor(Math.random() * h.length) + 1]);
			} else if (text[ii].toLowerCase() === 'i') {
				cancerCharacters.push(i[Math.floor(Math.random() * i.length) + 1]);
			} else if (text[ii].toLowerCase() === 'j') {
				cancerCharacters.push(j[Math.floor(Math.random() * j.length) + 1]);
			} else if (text[ii].toLowerCase() === 'k') {
				cancerCharacters.push(k[Math.floor(Math.random() * k.length) + 1]);
			} else if (text[ii].toLowerCase() === 'l') {
				cancerCharacters.push(l[Math.floor(Math.random() * l.length) + 1]);
			} else if (text[ii].toLowerCase() === 'm') {
				cancerCharacters.push(m[Math.floor(Math.random() * m.length) + 1]);
			} else if (text[ii].toLowerCase() === 'n') {
				cancerCharacters.push(n[Math.floor(Math.random() * n.length) + 1]);
			} else if (text[ii].toLowerCase() === 'o') {
				cancerCharacters.push(o[Math.floor(Math.random() * o.length) + 1]);
			} else if (text[ii].toLowerCase() === 'p') {
				cancerCharacters.push(p[Math.floor(Math.random() * p.length) + 1]);
			} else if (text[ii].toLowerCase() === 'q') {
				cancerCharacters.push(q[Math.floor(Math.random() * q.length) + 1]);
			} else if (text[ii].toLowerCase() === 'r') {
				cancerCharacters.push(r[Math.floor(Math.random() * r.length) + 1]);
			} else if (text[ii].toLowerCase() === 's') {
				cancerCharacters.push(s[Math.floor(Math.random() * s.length) + 1]);
			} else if (text[ii].toLowerCase() === 't') {
				cancerCharacters.push(t[Math.floor(Math.random() * t.length) + 1]);
			} else if (text[ii].toLowerCase() === 'u') {
				cancerCharacters.push(u[Math.floor(Math.random() * u.length) + 1]);
			} else if (text[ii].toLowerCase() === 'v') {
				cancerCharacters.push(v[Math.floor(Math.random() * v.length) + 1]);
			} else if (text[ii].toLowerCase() === 'w') {
				cancerCharacters.push(w[Math.floor(Math.random() * w.length) + 1]);
			} else if (text[ii].toLowerCase() === 'x') {
				cancerCharacters.push(x[Math.floor(Math.random() * x.length) + 1]);
			} else if (text[ii].toLowerCase() === 'y') {
				cancerCharacters.push(y[Math.floor(Math.random() * y.length) + 1]);
			} else if (text[ii].toLowerCase() === 'z') {
				cancerCharacters.push(z[Math.floor(Math.random() * z.length) + 1]);
			} else {
				cancerCharacters.push(text[ii]);
			}
		}
		return msg.send(cancerCharacters.join(''), { code: 'fix' });
	}
};
