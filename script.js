const searchBox = document.getElementById("searchBox");

searchBox.addEventListener("keyup", function () {

    const search = searchBox.value.toLowerCase();

    const books = document.querySelectorAll(".searchable");

    books.forEach(function(book){

        if(book.innerText.toLowerCase().includes(search)){

            book.style.display = "block";

        }else{

            book.style.display = "none";

        }

    });

});
