module.exports = {
    parseStringIntoArray: function (StringData) {
        if(StringData!==""){
            let data = StringData.split('~');
           return data.splice(1,data.length-2);
        }
        else return [];

    },
    parseArrayIntoString: function (ArrayData) {
        if(ArrayData.length>0){
            var str="~"+ArrayData[0];
            for(let i=1;i<ArrayData.length;i++)
                {
                    str=str+'~'+ArrayData[i];
                }
                str=str+'~';
            return str;
        }
        else return "";

    }
}