const post_data = document.querySelector('#post_data');

const load_button = document.querySelector('#load_button');

var start_index = 0;

var number_of_record = 5;

load_data();

load_button.addEventListener('click', () => {

    load_data();

});

function load_data(){
    load_button.innerHTML = 'wait...';

    load_button.disabled = true;

    setTimeout(function(){

        const req = new XMLHttpRequest();

        req.open('GET', `/get_data?start_index=${start_index}&num_record=${number_of_record}`);

        req.onload = () => {
            const results = JSON.parse(req.responseText);
           

            let html = '';
            if(results.length > 0)
            {   
                for(var i = 0; i < results.length; i++){
                    const item = results[i]; 
                    var url;
                    if(item.image_path == null){
                        url = "https://elasticbeanstalk-us-east-1-930627110385.s3.us-east-1.amazonaws.com/images/na.jpg";
                    }
                    else{
                        url = item.image_path;
                    }

                    html += `
                    <div class="storeItem col-md-2 col-sm-12">
                        <img src=` + url +  ` alt=` + item.itemName + ` width="100%" height="30%"> 
                        <p> <b>Name:</b> ` + item.itemName + `</p>
                        <p> <b>Category:</b> ` + item.category + `</p>
                        <p> <b>Name:</b>` +  item.price + `</p>
                        <button type="button" href="" class="btn btn-success">Add To Cart</button>

                    </div>`

                    start_index++;

        
                };

                load_button.innerHTML = 'Load More';

                load_button.disabled = false;
            }

            else
            {
                html += `<p> No more items!</p>`

                load_button.remove();
            }

            post_data.innerHTML = post_data.innerHTML + html;

            window.scrollTo(0, document.body.scrollHeight);
        };

        req.send();

    }, 1000);
}