class IDB {
    constructor(dbname, stores = [], callback = () => {}){
        let conn = indexedDB.open(dbname, 1);
        conn.onupgradeneeded = () => {
            let db = conn.result;
            stores.forEach(store => {
                db.createObjectStore(store, {keyPath: "id", autoIncrement: true});
            });
        };

        conn.onsuccess = () => {
            this.db = conn.result;
            callback(this);
        };
    }

    objectStore(name){
        return this.db.transaction(name, "readwrite").objectStore(name);
    }

    get(name, id){
        return new Promise(res => {
            let os = this.objectStore(name);;
            let req = os.get(id);
            req.onsuccess = () => res(req.result);
        });
    }

    getAll(name){
        return new Promise(res => {
            let os = this.objectStore(name);;
            let req = os.getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    add(name, data){
        return new Promise(res => {
            let os = this.objectStore(name);;
            let req = os.add(data);
            req.onsuccess = () => res(req.result);
        });   
    }

    delete(name, id){
        return new Promise(res => {
            let os = this.objectStore(name);;
            let req = os.delete(id);
            req.onsuccess = () => res(req.result);
        });   
    }

    put(name, data){
        return new Promise(res => {
            let os = this.objectStore(name);;
            let req = os.put(data);
            req.onsuccess = () => res(req.result);
        });   
    }
}


class HashModule {
    constructor(root_selector, list = []){
        this.$root = $(root_selector);
        this.hasList = list;
        this.showList = [];
        this.focusIdx = null;
        this.tags = [];
        this.name = this.$root.data("name");

        this.init();
        this.setEvents();
    }

    get keyword(){
        return this.$input ? this.$input.val() : "";
    }

    get focusItem(){
        return this.showList[this.focusIdx];
    }

    init(){
        this.$root.html(`<div class="hash-module">
                            <input type="hidden" class="hash-module__value" name="${this.name}">
                            <div class="hash-module__input">
                                <input type="text">
                                <div class="example-list">
                                </div>
                            </div>
                        </div>
                        <div class="error"></div>`);
        this.$container = this.$root.find(".hash-module");
        this.$value = this.$root.find(".hash-module__value");
        this.$input = this.$root.find(".hash-module__input > input");
        this.$examples = this.$root.find(".example-list");
        this.$error = this.$root.find(".error");
    }

    pushTag(tagname){
        if(tagname.length < 2 || tagname.length > 30) {
            return false;
        } else if(this.tags.length >= 10){
            this.$error.text("태그는 10개까지만 추가할 수 있습니다.");
            return false;
        } else if(this.tags.includes(tagname)){
            this.$error.text("이미 추가한 태그입니다.");
            return false;
        }

        this.$input.val("");
        this.tags.push(tagname);
        this.render();
    }

    render(){
        // 에러 메세지 삭제
        this.$error.text("");

        // 자동완성
        this.$examples.html("");
        if(this.showList.length > 0){
            this.showList.forEach(exp => {
                this.$examples.append(`<div class="example-list__item">#${exp}</div>`);
            });
        }
        
        // 태그
        this.$container.find(".hash-module__item").remove();
        this.tags.forEach((tag, i) => {
            this.$container.append(`<div class="hash-module__item">#${tag}<span class="remove" data-idx="${i}">×</span></div>`);
        });

        this.$value.val( JSON.stringify(this.tags) );
        this.$input.focus();
    }

    setEvents(){
        this.$input.on("input", e => {
            // 입력 제한
            e.target.value = e.target.value.replace(/([^0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣_])/g, "").substr(0, 30);
            this.$input.focus();
            
            
            // 자동완성에 추가
            this.showList = [];
            if(this.keyword){
                let regex = new RegExp(
                    "^" + this.keyword.replace(/([.+*?^$\[\]\(\)\\\\\\/])/g, "\\$1")
                    );
                this.hasList.forEach(exp => {
                    if(regex.test(exp) && !this.showList.includes(exp)){
                        this.showList.push(exp);
                    }
                });
            }
            this.render();
        });


        // 키 입력
        this.$input.on("keydown", e => {
            // Focus & Enter
            if(e.keyCode === 13 && this.focusItem){
                this.pushTag(this.focusItem);
            }
            // Enter, Tab, Spacebar
            else if([13, 9, 32].includes(e.keyCode)){
                this.pushTag(this.keyword);
            }
            this.render();
        });

        // 태그 삭제
        this.$root.on("click", ".remove", e => {
            let idx = parseInt( e.currentTarget.dataset.idx ); 
            this.tags.splice(idx, 1);
            this.render();
        });
    }
}